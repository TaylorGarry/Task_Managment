// import express from 'express'
// import multer from 'multer';
// import {
//   editMessage,
//   deleteMessage,
//   getChatMessages,
//   reactToMessage,
//   markAsRead,
//   sendOneToOneMessage
// } from '../Controllers/message.controller.js';
// import { authMiddleware } from '../Middlewares/auth.middleware.js';

// const router = express.Router();

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/temp/');
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
//                        'audio/mpeg', 'audio/wav', 'audio/ogg',
//                        'application/pdf', 'application/msword', 
//                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//                        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//                        'application/zip', 'application/x-rar-compressed'];
  
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only images, audio, and documents are allowed.'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, 
//     files: 10 
//   }
// });

 
// router.post('/', 
//   authMiddleware,
//   upload.array('files', 10), 
//   sendOneToOneMessage
// );

 
// router.put('/:messageId', authMiddleware, editMessage);            
// router.delete('/:messageId', authMiddleware, deleteMessage);      
// router.get('/chats/:chatId/messages', authMiddleware, getChatMessages);
// router.post('/:messageId/reaction', authMiddleware, reactToMessage);  
// router.post('/:messageId/read', authMiddleware, markAsRead);           

 
// router.put('/test/:id', authMiddleware, (req, res) => {
//   console.log('Test PUT route hit:', req.params.id);
//   res.json({ 
//     success: true, 
//     message: 'PUT route works', 
//     id: req.params.id,
//     body: req.body 
//   });
// });

// export default router;





import express from 'express';
import {
  editMessage,
  deleteMessage,
  getChatMessages,
  reactToMessage,
  markAsRead,
  sendOneToOneMessage,
  uploadFile,
  deleteUploadedFile,
  getChatMedia,
  proxyDownload
} from '../Controllers/message.controller.js';
import { authMiddleware } from '../Middlewares/auth.middleware.js';
import { uploadSingleFile, uploadMultipleFiles } from '../Middlewares/upload.middleware.js';

const router = express.Router();

router.post('/upload', 
  authMiddleware,
  uploadSingleFile,  
  uploadFile
);

router.post('/upload-multiple',
  authMiddleware,
  uploadMultipleFiles,   
  uploadFile
);

router.delete('/file',
  authMiddleware,
  deleteUploadedFile
);

router.post('/send',
  authMiddleware,
  sendOneToOneMessage   
);

router.get('/chats/:chatId/messages', authMiddleware, getChatMessages);

router.get('/media/:chatId', authMiddleware, getChatMedia);

router.put('/:messageId', authMiddleware, editMessage);

router.delete('/:messageId', authMiddleware, deleteMessage);

router.post('/:messageId/reaction', authMiddleware, reactToMessage);

router.post('/:messageId/read', authMiddleware, markAsRead);
router.get('/proxy-download', authMiddleware, proxyDownload);

router.put('/test/:id', authMiddleware, (req, res) => {
  console.log('Test PUT route hit:', req.params.id);
  res.json({ 
    success: true, 
    message: 'PUT route works', 
    id: req.params.id,
    body: req.body 
  });
});

export default router;