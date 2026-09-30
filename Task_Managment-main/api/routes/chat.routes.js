import express from 'express';
import multer from 'multer';
import {
  getOrCreateOneToOneChat,
  getUserChats,
  searchUsers
} from '../Controllers/chat.controller.js';
import { authMiddleware } from '../Middlewares/auth.middleware.js';

const router = express.Router();


const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});



router.get('/one-to-one/:userId', authMiddleware, getOrCreateOneToOneChat);
router.get('/', authMiddleware, getUserChats);
router.get("/search", authMiddleware, searchUsers);

export default router;