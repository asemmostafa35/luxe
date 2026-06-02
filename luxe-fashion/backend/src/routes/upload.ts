import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireStaff } from '../middleware/rbac';
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => { if (file.mimetype.startsWith('image/')) cb(null, true); else cb(new Error('Images only')); } });
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
router.post('/', authenticate, requireStaff, requirePermission('products:write'), upload.array('images', 10), async (req: any, res, next) => {
  try {
    const urls: string[] = [];
    for (const file of req.files) {
      const filename = `${uuidv4()}.webp`;
      const filepath = path.join(uploadsDir, filename);
      await sharp(file.buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(filepath);
      urls.push(`/uploads/${filename}`);
    }
    res.json({ urls });
  } catch(e) { next(e); }
});
export default router;
