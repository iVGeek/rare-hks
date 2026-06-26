(function () {
  'use strict';

  /* ===============================
     Preloader
     =============================== */
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    function hidePreloader() {
      preloader.classList.add('hidden');
      document.body.style.overflow = '';
    }
    if (document.readyState === 'complete') {
      setTimeout(hidePreloader, 600);
    } else {
      window.addEventListener('load', function () {
        setTimeout(hidePreloader, 600);
      });
    }
    setTimeout(hidePreloader, 5000);
  }

  /* ===============================
     Custom Cursor + Trail
     =============================== */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (cursorDot && cursorRing && !isTouch) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    /* trail: create trailing dots */
    var trail = [];
    var trailCount = 5;
    var trailContainer = document.createElement('div');
    trailContainer.className = 'cursor-trail';
    trailContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(trailContainer);

    for (var t = 0; t < trailCount; t++) {
      var dot = document.createElement('div');
      dot.className = 'cursor-trail-dot';
      dot.style.cssText = 'position:fixed;width:4px;height:4px;background:var(--color-accent,gold);border-radius:50%;pointer-events:none;z-index:9998;opacity:' + (0.5 - t * 0.08) + ';transform:translate(-50%,-50%);transition:opacity 0.3s';
      trailContainer.appendChild(dot);
      trail.push({ el: dot, x: 0, y: 0 });
    }

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    /* click burst effect */
    document.addEventListener('mousedown', function (e) {
      var burstCount = 8;
      var burstColor = '#FFD700';
      for (var b = 0; b < burstCount; b++) {
        var spark = document.createElement('div');
        var angle = (b / burstCount) * 2 * Math.PI;
        var dist = 20 + Math.random() * 20;
        spark.style.cssText = 'position:fixed;width:' + (2 + Math.random() * 3) + 'px;height:' + (2 + Math.random() * 3) + 'px;background:' + burstColor + ';border-radius:50%;pointer-events:none;z-index:9997;left:' + e.clientX + 'px;top:' + e.clientY + 'px;transform:translate(-50%,-50%)';
        document.body.appendChild(spark);
        var start = performance.now();
        (function (el, angle, dist) {
          function animateBurst(now) {
            var elapsed = now - start;
            var progress = elapsed / 400;
            if (progress >= 1) { el.remove(); return; }
            var x = e.clientX + Math.cos(angle) * dist * (1 - Math.pow(1 - progress, 2));
            var y = e.clientY + Math.sin(angle) * dist * (1 - Math.pow(1 - progress, 2));
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.opacity = 1 - progress;
            requestAnimationFrame(animateBurst);
          }
          requestAnimationFrame(animateBurst);
        })(spark, angle, dist);
      }
    });

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';

      /* trail follows with increasing delay */
      for (var i = 0; i < trailCount; i++) {
        var prevX = i === 0 ? mouseX : trail[i - 1].x;
        var prevY = i === 0 ? mouseY : trail[i - 1].y;
        trail[i].x += (prevX - trail[i].x) * (0.15 - i * 0.02);
        trail[i].y += (prevY - trail[i].y) * (0.15 - i * 0.02);
        trail[i].el.style.left = trail[i].x + 'px';
        trail[i].el.style.top = trail[i].y + 'px';
      }

      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const hoverTargets = document.querySelectorAll(
      'a, button, .btn, .work-card, .lookbook-item, .signature-piece, .interactive, .form-input, .form-textarea, .nav-toggle, .back-to-top'
    );
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorRing.classList.add('hovering');
        trail.forEach(function (d) { d.el.style.opacity = '0.8'; });
      });
      el.addEventListener('mouseleave', function () {
        cursorRing.classList.remove('hovering');
        trail.forEach(function (d) {
          /* restore original opacity based on index */
          var idx = Array.prototype.indexOf.call(trail, d);
          d.el.style.opacity = 0.5 - idx * 0.08;
        });
      });
    });

    document.addEventListener('mouseleave', function () {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
      trail.forEach(function (d) { d.el.style.opacity = '0'; });
    });
    document.addEventListener('mouseenter', function () {
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
      trail.forEach(function (d) { d.el.style.opacity = 0.5 - Array.prototype.indexOf.call(trail, d) * 0.08; });
    });
  } else if (cursorDot && cursorRing) {
    cursorDot.style.display = 'none';
    cursorRing.style.display = 'none';
  }

  /* ===============================
     Mobile 100vh fix
     =============================== */
  (function () {
    function setVh() {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
    }
    setVh();
    window.addEventListener('resize', setVh);
  }());

  /* ===============================
     Particles (Hero)
     =============================== */
  (function () {
    var container = document.querySelector('.hero-particles');
    if (!container) return;
    var count = window.innerWidth < 768 ? 10 : 20;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'hero-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = (70 + Math.random() * 40) + '%';
      p.style.animationDelay = (Math.random() * 6) + 's';
      p.style.animationDuration = (4 + Math.random() * 4) + 's';
      p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
      container.appendChild(p);
    }
  }());

  /* ===============================
     Nav: Scroll Effects
     =============================== */
  (function () {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var lastScroll = 0;

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;

      if (scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      if (scrollY > 200) {
        if (scrollY > lastScroll) {
          nav.classList.add('hidden');
        } else {
          nav.classList.remove('hidden');
        }
      } else {
        nav.classList.remove('hidden');
      }

      lastScroll = scrollY;
    }, { passive: true });
  }());

  /* ===============================
     Mobile Nav Toggle
     =============================== */
  (function () {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
      links.classList.toggle('open');
      document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.classList.remove('active');
        links.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }());

  /* ===============================
     Back to Top
     =============================== */
  (function () {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 600) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }());

  /* ===============================
     Cart Module
     =============================== */
  var cart = (function () {
    var KEY = 'rarehooks_cart';
    var items = [];

    function load() {
      try {
        var saved = localStorage.getItem(KEY);
        items = saved ? JSON.parse(saved) : [];
      } catch (e) { items = []; }
    }

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    }

    function getItems() { return items; }

    function getCount() {
      return items.reduce(function (sum, i) { return sum + i.quantity; }, 0);
    }

    function getTotal() {
      return items.reduce(function (sum, i) { return sum + i.price * i.quantity; }, 0);
    }

    function add(product) {
      var existing = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === product.id) { existing = items[i]; break; }
      }
      if (existing) {
        existing.quantity += 1;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image || '',
          quantity: 1,
        });
      }
      save();
      emitChange();
    }

    function remove(id) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) { items.splice(i, 1); break; }
      }
      save();
      emitChange();
    }

    function setQuantity(id, qty) {
      if (qty < 1) { remove(id); return; }
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) { items[i].quantity = qty; break; }
      }
      save();
      emitChange();
    }

    function clear() {
      items = [];
      save();
      emitChange();
    }

    var listeners = [];
    function onChange(fn) { listeners.push(fn); }
    function emitChange() {
      for (var i = 0; i < listeners.length; i++) { listeners[i](items); }
    }

    load();
    return { getItems: getItems, getCount: getCount, getTotal: getTotal, add: add, remove: remove, setQuantity: setQuantity, clear: clear, onChange: onChange };
  }());

  /* ===============================
     Cart UI
     =============================== */
  (function () {
    var sidebar = document.getElementById('cartSidebar');
    var overlay = document.getElementById('cartOverlay');
    var toggle = document.getElementById('cartToggle');
    var close = document.getElementById('cartClose');
    var body = document.getElementById('cartBody');
    var itemsEl = document.getElementById('cartItems');
    var emptyEl = document.getElementById('cartEmpty');
    var footerEl = document.getElementById('cartFooter');
    var totalEl = document.getElementById('cartTotal');
    var badge = document.getElementById('cartBadge');
    var checkoutBtn = document.getElementById('cartCheckoutBtn');

    if (!sidebar) return;

    function esc(s) {
      if (s == null) return '';
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    function openCart() {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      renderCart();
    }

    function closeCart() {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function renderCart() {
      var items = cart.getItems();
      badge.textContent = cart.getCount();
      badge.style.display = cart.getCount() > 0 ? 'flex' : 'none';

      if (!sidebar.classList.contains('open')) return;

      if (items.length === 0) {
        itemsEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        footerEl.style.display = 'none';
      } else {
        itemsEl.style.display = '';
        emptyEl.style.display = 'none';
        footerEl.style.display = '';
        var html = '';
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          var subtotal = it.price * it.quantity;
          html += '<div class="cart-item" data-id="' + esc(it.id) + '">' +
            '<img src="' + esc(it.image) + '" alt="' + esc(it.name) + '" class="cart-item-img" loading="lazy">' +
            '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + esc(it.name) + '</div>' +
            '<div class="cart-item-price">KES ' + it.price.toLocaleString() + '</div>' +
            '<div class="cart-item-actions">' +
            '<button class="cart-item-qty-btn" data-action="dec">-</button>' +
            '<span class="cart-item-qty">' + it.quantity + '</span>' +
            '<button class="cart-item-qty-btn" data-action="inc">+</button>' +
            '<button class="cart-item-remove" data-action="remove">Remove</button>' +
            '</div></div>' +
            '<div class="cart-item-total">KES ' + subtotal.toLocaleString() + '</div>' +
            '</div>';
        }
        itemsEl.innerHTML = html;
        totalEl.textContent = 'KES ' + cart.getTotal().toLocaleString();
      }
    }

    cart.onChange(renderCart);

    toggle.addEventListener('click', openCart);
    close.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    itemsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var itemEl = btn.closest('.cart-item');
      if (!itemEl) return;
      var id = itemEl.dataset.id;
      var action = btn.dataset.action;
      if (action === 'inc') { cart.setQuantity(id, (cart.getItems().find(function (i) { return i.id === id; }) || {}).quantity + 1); }
      else if (action === 'dec') { cart.setQuantity(id, (cart.getItems().find(function (i) { return i.id === id; }) || {}).quantity - 1); }
      else if (action === 'remove') { cart.remove(id); }
    });

    checkoutBtn.addEventListener('click', function () {
      closeCart();
      var items = cart.getItems();
      if (items.length === 0) return;
      openShippingModalFromCart(items);
    });

    /* Sync badge on page load */
    badge.textContent = cart.getCount();
    badge.style.display = cart.getCount() > 0 ? 'flex' : 'none';
  }());

  /* ===============================
     Product + Lookbook Renderer
     =============================== */
  (function () {
    var productsGrid = document.getElementById('productsGrid');
    var lookbookGrid = document.getElementById('lookbookGrid');
    if (!productsGrid && !lookbookGrid) return;

    function esc(s) {
      if (s == null) return '';
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    function renderProducts(products) {
      var delays = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3', 'reveal-delay-4'];

      if (productsGrid) {
        productsGrid.innerHTML = '';
        products.forEach(function (p, i) {
          var card = document.createElement('div');
          card.className = 'work-card anime-panel reveal ' + (delays[i % delays.length] || '');
          card.tabIndex = 0;
          card.setAttribute('role', 'button');
          card.setAttribute('aria-label', 'View ' + p.name + ' cap');
          card.innerHTML =
            '<img src="' + esc(p.image || '') + '" alt="' + esc(p.name) + ' crochet cap" class="work-card-img" loading="lazy">' +
            '<div class="work-card-overlay">' +
            '<span class="work-card-tag">' + esc(p.tag) + '</span>' +
            '<h3 class="work-card-title">' + esc(p.name) + '</h3>' +
            '<p class="work-card-desc">' + esc(p.description || '') + '</p>' +
            '<p class="work-card-price">KES ' + p.price.toLocaleString() + '</p>' +
            '<div class="work-card-actions">' +
            '<button class="btn-add-cart" data-product-id="' + esc(p.id) + '" data-product-name="' + esc(p.name) + '" data-price="' + p.price + '" data-image="' + esc(p.image || '') + '">Add to Cart</button>' +
            '<button class="btn btn-primary btn-buy" data-product-id="' + esc(p.id) + '" data-product-name="' + esc(p.name) + '" data-price="' + p.price + '">Buy Now</button>' +
            '</div>' +
            '</div>';
          productsGrid.appendChild(card);
        });
      }

      if (lookbookGrid) {
        lookbookGrid.innerHTML = '';
        products.forEach(function (p, i) {
          var item = document.createElement('div');
          item.className = 'lookbook-item reveal ' + (delays[i % delays.length] || '');
          item.tabIndex = 0;
          item.setAttribute('role', 'button');
          item.setAttribute('aria-label', 'View cap style');
          item.innerHTML =
            '<img src="' + esc(p.image || '') + '" alt="Cap look" class="lookbook-item-image" loading="lazy">' +
            '<div class="lookbook-item-overlay"><span class="lookbook-item-label">' + esc(p.name) + '</span></div>';
          lookbookGrid.appendChild(item);
        });
      }

      observeReveals();
    }

    fetch('/api/products')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderProducts(data);
      })
      .catch(function () {
        renderProducts([
          { id: 'jungle-green', name: 'Jungle Green', price: 2500, tag: 'Ready-Made', image: '', description: 'Deep green precision cap.' },
        ]);
      });

    /* Add to Cart event delegation */
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-add-cart');
      if (!btn) return;
      e.stopPropagation();
      cart.add({
        id: btn.dataset.productId,
        name: btn.dataset.productName,
        price: parseInt(btn.dataset.price, 10),
        image: btn.dataset.image || '',
      });
      /* brief feedback */
      var orig = btn.textContent;
      btn.textContent = 'Added!';
      btn.style.borderColor = '#FFD700';
      btn.style.background = 'rgba(255,215,0,0.15)';
      setTimeout(function () {
        btn.textContent = orig;
        btn.style.borderColor = '';
        btn.style.background = '';
      }, 800);
    });
  }());

  /* ===============================
     Scroll Reveal
     =============================== */
  var revealObserver = null;
  function observeReveals() {
    var reveals = document.querySelectorAll('.reveal:not(.visible)');
    if (!reveals.length) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    }
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }
  observeReveals();

  /* ===============================
     Lightbox
     =============================== */
  (function () {
    var lightbox = document.querySelector('.lightbox');
    var closeBtn = document.querySelector('.lightbox-close');
    var container = document.querySelector('.lightbox-content');
    if (!lightbox || !closeBtn || !container) return;

    document.addEventListener('click', function (e) {
      var item = e.target.closest('.lookbook-item');
      if (!item) return;
      var img = item.querySelector('img');
      if (img) {
        container.innerHTML = '';
        var clone = img.cloneNode(true);
        clone.style.maxWidth = '90vw';
        clone.style.maxHeight = '90vh';
        clone.style.objectFit = 'contain';
        container.appendChild(clone);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }());

  /* ===============================
     Smooth Scroll
     =============================== */
  (function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          var offset = 80;
          var top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }());

  /* ===============================
     Shipping + Paystack Payment (2-step)
     =============================== */
  (function () {
    var shippingModal = document.getElementById('shippingModal');
    var shippingCloseBtn = document.getElementById('shippingModalClose');
    var shippingForm = document.getElementById('shippingForm');
    var cartSummaryEl = document.getElementById('cartSummary');
    var shippingSubmitBtn = document.getElementById('shippingSubmitBtn');

    var paymentModal = document.getElementById('paymentModal');
    var paymentCloseBtn = document.getElementById('paymentModalClose');
    var paymentForm = document.getElementById('paymentForm');
    var paymentEmailInput = document.getElementById('payment-email');
    var paymentCartSummary = document.getElementById('paymentCartSummary');
    var paymentSubmitBtn = document.getElementById('paymentSubmitBtn');
    var paymentSubmitPrice = document.getElementById('paymentSubmitPrice');

    var currentCart = null;
    var currentShipping = null;
    var paymentStepShipping = document.getElementById('paymentStepShipping');

    if (!shippingModal || !shippingForm || !paymentModal || !paymentForm) return;

    function esc(s) {
      if (s == null) return '';
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    function renderCartSummary(container, items, total) {
      if (!container) return;
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var subtotal = it.price * (it.quantity || 1);
        html += '<div class="cart-summary-item">' +
          '<span><span class="cart-summary-name">' + esc(it.name) + '</span> <span class="cart-summary-qty">x' + (it.quantity || 1) + '</span></span>' +
          '<span class="cart-summary-price">KES ' + subtotal.toLocaleString() + '</span>' +
          '</div>';
      }
      html += '<div class="cart-summary-total"><span>Total</span><span>KES ' + total.toLocaleString() + '</span></div>';
      container.innerHTML = html;
    }

    function openShippingModalFromCart(items) {
      currentCart = items;
      currentShipping = null;
      var total = items.reduce(function (s, i) { return s + i.price * (i.quantity || 1); }, 0);
      renderCartSummary(cartSummaryEl, items, total);
      shippingForm.reset();
      if (paymentStepShipping) paymentStepShipping.classList.remove('active');
      shippingModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function openShippingModal(product) {
      openShippingModalFromCart([{ id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image || '' }]);
    }

    function closeShippingModal() {
      shippingModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    function openPaymentModal() {
      var total = currentCart.reduce(function (s, i) { return s + i.price * (i.quantity || 1); }, 0);
      renderCartSummary(paymentCartSummary, currentCart, total);
      paymentEmailInput.value = currentShipping?.email || '';
      if (paymentSubmitPrice) paymentSubmitPrice.textContent = total.toLocaleString();
      if (paymentStepShipping) paymentStepShipping.classList.add('active');
      shippingModal.classList.remove('open');
      paymentModal.classList.add('open');
    }

    function closePaymentModal() {
      paymentModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-buy');
      if (btn) {
        e.stopPropagation();
        openShippingModal({
          id: btn.dataset.productId,
          name: btn.dataset.productName,
          price: parseInt(btn.dataset.price, 10),
          image: btn.dataset.image || '',
        });
      }
    });

    shippingCloseBtn.addEventListener('click', closeShippingModal);
    shippingModal.addEventListener('click', function (e) {
      if (e.target === shippingModal || e.target.classList.contains('payment-modal-backdrop')) closeShippingModal();
    });

    paymentCloseBtn.addEventListener('click', closePaymentModal);
    paymentModal.addEventListener('click', function (e) {
      if (e.target === paymentModal || e.target.classList.contains('payment-modal-backdrop')) closePaymentModal();
    });

    shippingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!currentCart || currentCart.length === 0) return;

      var shipping = {
        name: document.getElementById('shipping-name').value.trim(),
        email: document.getElementById('shipping-email').value.trim(),
        phone: document.getElementById('shipping-phone').value.trim(),
        address: document.getElementById('shipping-address').value.trim(),
        city: document.getElementById('shipping-city').value.trim(),
        country: document.getElementById('shipping-country').value,
        postalCode: document.getElementById('shipping-postal').value.trim(),
        notes: document.getElementById('shipping-notes').value.trim(),
      };

      if (!shipping.name || !shipping.email || !shipping.phone || !shipping.address || !shipping.city) {
        alert('Please fill in all required fields.');
        return;
      }

      currentShipping = shipping;
      shippingSubmitBtn.disabled = true;
      var submitText = shippingSubmitBtn.querySelector('.shipping-submit-text');
      var submitArrow = shippingSubmitBtn.querySelector('.shipping-submit-arrow');
      if (submitText) submitText.textContent = 'Processing...';
      if (submitArrow) submitArrow.style.display = 'none';

      setTimeout(function () {
        shippingSubmitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Continue to Payment';
        if (submitArrow) submitArrow.style.display = 'flex';
        openPaymentModal();
      }, 300);
    });

    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!currentCart || currentCart.length === 0 || !currentShipping) return;

      var email = paymentEmailInput.value.trim();
      if (!email) return;

      var payBtnText = paymentSubmitBtn.querySelector('.shipping-submit-text');
      var payBtnArrow = paymentSubmitBtn.querySelector('.shipping-submit-arrow');

      paymentSubmitBtn.disabled = true;
      if (payBtnText) payBtnText.textContent = 'Processing...';
      if (payBtnArrow) payBtnArrow.style.display = 'none';

      var total = currentCart.reduce(function (s, i) { return s + i.price * (i.quantity || 1); }, 0);
      var firstItem = currentCart[0];
      var itemsPayload = currentCart.map(function (i) {
        return { productId: i.id, productName: i.name, price: i.price, quantity: i.quantity || 1, image: i.image || '' };
      });

      fetch('/api/initialize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          amount: total,
          productId: firstItem.id,
          productName: firstItem.name,
          metadata: { items: itemsPayload },
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.status && data.data && data.data.authorization_url) {
            var reference = data.data.reference;
            fetch('/api/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shipping: currentShipping,
                items: itemsPayload,
                productId: firstItem.id,
                productName: firstItem.name,
                amount: total,
                currency: 'KES',
                paymentReference: reference,
              }),
            }).then(function () {
              cart.clear();
              window.location.href = data.data.authorization_url;
            });
          } else {
            alert('Payment could not be initiated. Please try again.');
            paymentSubmitBtn.disabled = false;
            if (payBtnText) payBtnText.textContent = 'Pay Now';
            if (payBtnArrow) payBtnArrow.style.display = 'flex';
          }
        })
        .catch(function () {
          alert('Connection error. Please try again.');
          paymentSubmitBtn.disabled = false;
          if (payBtnText) payBtnText.textContent = 'Pay Now';
          if (payBtnArrow) payBtnArrow.style.display = 'flex';
        });
    });
  }());

  /* ===============================
     Contact Form (Backend)
     =============================== */
  (function () {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.form-submit');
      var data = {
        name: document.getElementById('contact-name')?.value || '',
        email: document.getElementById('contact-email')?.value || '',
        message: document.getElementById('contact-message')?.value || '',
      };

      btn.innerHTML = 'Sending...';
      btn.disabled = true;

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          btn.innerHTML = 'Message Sent!';
          btn.style.background = '#FFD700';
          setTimeout(function () {
            btn.innerHTML = 'Send It <span class="btn-arrow">→</span>';
            btn.style.background = '';
            btn.disabled = false;
            form.reset();
          }, 3000);
        })
        .catch(function () {
          btn.innerHTML = 'Error! Try Again';
          setTimeout(function () {
            btn.innerHTML = 'Send It <span class="btn-arrow">→</span>';
            btn.disabled = false;
          }, 2000);
        });
    });
  }());

  /* ===============================
     Parallax (Hero)
     =============================== */
  (function () {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;
      var bg = hero.querySelector('.hero-bg');
      if (bg && scrollY < window.innerHeight) {
        bg.style.transform = 'translateY(' + (scrollY * 0.3) + 'px)';
      }
    }, { passive: true });
  }());

  /* ===============================
     Smooth Scroll (Lenis)
     =============================== */
  if (typeof Lenis !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var lenis = new Lenis({
      duration: 0.6,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 0.5,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

}());
