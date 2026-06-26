import crypto from 'crypto';
import supabase from './supabase.js';

/* ───── In-memory store (source of truth) ───── */

const store = {
  admins: [],
  products: [],
  orders: [],
  messages: [],
};

/* ───── Sync helpers ───── */

let syncErrorAt = 0;
const SYNC_BACKOFF_MS = 30000;

function shouldSync() {
  return supabase && Date.now() - syncErrorAt > SYNC_BACKOFF_MS;
}

function syncFailed() {
  syncErrorAt = Date.now();
}

const baseImg = 'https://aabyxfcrrqivjupawxdu.supabase.co/storage/v1/object/public/store-images/4aa43748-90b3-4c4b-b74f-d337ea5b63e1/a1b59555-a5c2-4397-b7de-7ff0cc0e8670/products';

const defaultProducts = [
  { id: 'jungle-green', name: 'Jungle Green', price: 2500, currency: 'KES', tag: 'Ready-Made', stock: 10, image: baseImg + '/1780164202396.jpeg', description: 'Deep green precision cap with custom charm detail. Adjustable fit. NY edition.' },
  { id: 'blue-dream', name: 'Blue Dream', price: 2500, currency: 'KES', tag: 'Made to Order', stock: 5, image: baseImg + '/1780164297370.png', description: 'Clean blue build with signature charm. Adjustable. That West Coast energy.' },
  { id: 'cream-la', name: 'Cream LA', price: 2500, currency: 'KES', tag: 'Made to Order', stock: 5, image: baseImg + '/1780164466247.png', description: 'Neutral tone. Clean finish. Adjustable with charm detail. LA classic.' },
  { id: 'pink-haze', name: 'Pink Haze', price: 2500, currency: 'KES', tag: 'Made to Order', stock: 5, image: baseImg + '/1780250877970.jpeg', description: 'Bold pink statement cap with charm detail. Adjustable fit. NY edition.' },
  { id: 'bronx', name: 'Bronx', price: 2500, currency: 'KES', tag: 'Ready-Made', stock: 8, image: baseImg + '/1780930702522.png', description: 'Beige and navy. Clean build. Minimal. Straight out the borough.' },
  { id: 'blood-blue', name: 'Blood & Blue', price: 4500, currency: 'KES', tag: 'Bundle', stock: 3, image: baseImg + '/1780250840434.jpeg', description: 'Two-cap set. Red and blue builds with charm details. Double the drip.' },
];

async function loadFromSupabase() {
  if (!supabase) return false;
  try {
    const results = await Promise.all([
      supabase.from('admin_accounts').select('*'),
      supabase.from('products').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('contact_messages').select('*'),
    ]);
    let anyLoaded = false;
    const sets = [
      { data: results[0].data, arr: store.admins },
      { data: results[1].data, arr: store.products },
      { data: results[2].data, arr: store.orders },
      { data: results[3].data, arr: store.messages },
    ];
    for (const { data, arr } of sets) {
      if (data && data.length > 0) {
        arr.length = 0; arr.push(...data);
        if (!anyLoaded) anyLoaded = true;
      }
    }
    return anyLoaded;
  } catch (err) {
    console.warn('Store: Supabase query failed:', err.message);
    return false;
  }
}

async function initStore() {
  const loaded = await loadFromSupabase();
  if (!loaded) {
    if (store.admins.length === 0) {
      const masterHash = process.env.ADMIN_PASSWORD_HASH || crypto.createHash('sha256').update('rarehooks2024').digest('hex');
      store.admins.push({ id: 'master', username: 'master', password_hash: masterHash, role: 'superadmin', created_at: new Date().toISOString() });
    }
    if (store.products.length === 0) {
      store.products.push(...defaultProducts.map(p => ({ ...p, created_at: new Date().toISOString() })));
    }
    console.log(`Store: initialized with fallback (${store.admins.length} admins, ${store.products.length} products)`);
  }
}

async function syncInsert(table, row) {
  if (!shouldSync()) return;
  try {
    const { error } = await supabase.from(table).insert([row]);
    if (error) { console.warn(`Store sync insert ${table}:`, error.message); syncFailed(); }
  } catch (_) { syncFailed(); }
}

async function syncUpdate(table, match, updates) {
  if (!shouldSync()) return;
  try {
    const { error } = await supabase.from(table).update(updates).eq(match.key, match.value);
    if (error) { console.warn(`Store sync update ${table}:`, error.message); syncFailed(); }
  } catch (_) { syncFailed(); }
}

async function syncDelete(table, match) {
  if (!shouldSync()) return;
  try {
    const { error } = await supabase.from(table).delete().eq(match.key, match.value);
    if (error) { console.warn(`Store sync delete ${table}:`, error.message); syncFailed(); }
  } catch (_) { syncFailed(); }
}

/* ───── Public API ───── */

export async function getAdmins() {
  return store.admins;
}

export async function getProducts() {
  return store.products;
}

export async function getOrders() {
  return store.orders;
}

export async function addProduct(product) {
  store.products.push(product);
  syncInsert('products', product);
  return product;
}

export async function updateProduct(id, updates) {
  const idx = store.products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  Object.assign(store.products[idx], updates);
  syncUpdate('products', { key: 'id', value: id }, updates);
  return store.products[idx];
}

export async function deleteProduct(id) {
  const idx = store.products.findIndex(p => p.id === id);
  if (idx !== -1) store.products.splice(idx, 1);
  syncDelete('products', { key: 'id', value: id });
}

export async function addOrder(order) {
  store.orders.push(order);
  syncInsert('orders', order);
  return order;
}

export async function updateOrder(id, updates) {
  const idx = store.orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  Object.assign(store.orders[idx], updates);
  syncUpdate('orders', { key: 'id', value: id }, updates);
  return store.orders[idx];
}

export async function addAdmin(admin) {
  store.admins.push(admin);
  syncInsert('admin_accounts', admin);
  return admin;
}

export async function updateAdmin(id, updates) {
  const idx = store.admins.findIndex(a => a.id === id);
  if (idx === -1) return null;
  Object.assign(store.admins[idx], updates);
  syncUpdate('admin_accounts', { key: 'id', value: id }, updates);
  return store.admins[idx];
}

export async function deleteAdmin(id) {
  const idx = store.admins.findIndex(a => a.id === id);
  if (idx !== -1) store.admins.splice(idx, 1);
  syncDelete('admin_accounts', { key: 'id', value: id });
}

export async function addMessage(msg) {
  store.messages.push(msg);
  syncInsert('contact_messages', msg);
  return msg;
}

export async function getMessages() {
  return store.messages;
}

export async function markMessageRead(id) {
  const idx = store.messages.findIndex(m => m.id === id);
  if (idx !== -1) store.messages[idx].read = true;
  syncUpdate('contact_messages', { key: 'id', value: id }, { read: true });
}

/* ───── Boot ───── */

const ready = initStore();

export async function waitForStore() {
  await ready;
}

export default store;