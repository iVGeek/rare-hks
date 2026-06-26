import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import supabase from '../db/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(12).toString('hex') + ext;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router();

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided. Allowed: jpg, png, webp, gif, avif (max 8MB)' });

    const localUrl = '/uploads/' + req.file.filename;

    if (supabase) {
      try {
        const buf = fs.readFileSync(req.file.path);
        const sbPath = 'uploads/' + req.file.filename;
        const { error } = await supabase.storage.from('store-images').upload(sbPath, buf, {
          contentType: req.file.mimetype,
          upsert: true,
        });
        if (!error) {
          const { data: pub } = supabase.storage.from('store-images').getPublicUrl(sbPath);
          return res.json({ status: true, url: pub.publicUrl, localUrl });
        }
      } catch (_) {}
    }

    res.json({ status: true, url: localUrl, localUrl, note: 'Stored locally only — Supabase unavailable' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;