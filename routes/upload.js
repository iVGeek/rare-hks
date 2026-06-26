import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import supabase from '../db/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router();

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided. Allowed: jpg, png, webp, gif, avif (max 8MB)' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = crypto.randomBytes(12).toString('hex') + ext;

    if (supabase) {
      try {
        const sbPath = 'uploads/' + filename;
        const { error } = await supabase.storage.from('store-images').upload(sbPath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });
        if (!error) {
          const { data: pub } = supabase.storage.from('store-images').getPublicUrl(sbPath);
          return res.json({ status: true, url: pub.publicUrl });
        }
        console.error('Supabase upload error:', error?.message, error?.status);
        return res.status(502).json({ status: false, error: 'Supabase storage upload failed: ' + (error?.message || 'unknown') });
      } catch (sbErr) {
        console.error('Supabase upload exception:', sbErr?.message);
        return res.status(502).json({ status: false, error: 'Supabase storage exception: ' + (sbErr?.message || 'unknown') });
      }
    }

    res.json({ status: true, url: '', note: 'Supabase client not configured' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;