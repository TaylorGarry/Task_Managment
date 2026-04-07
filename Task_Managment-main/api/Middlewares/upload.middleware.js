import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = {
    // Images
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'image/svg+xml': true,
    'image/bmp': true,
    'image/tiff': true,
    
    // Documents
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'application/vnd.ms-powerpoint': true,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
    'text/plain': true,
    'text/csv': true,
    'application/json': true,
    
    // Audio
    'audio/mpeg': true, // mp3
    'audio/wav': true,
    'audio/ogg': true,
    'audio/mp4': true,
    'audio/x-m4a': true,
    'audio/x-wav': true,
    
    // Video
    'video/mp4': true,
    'video/webm': true,
    'video/ogg': true,
    'video/x-msvideo': true, // avi
    'video/quicktime': true, // mov
    'video/x-ms-wmv': true,
    
    // Archives
    'application/zip': true,
    'application/x-rar-compressed': true,
    'application/x-7z-compressed': true,
    'application/x-tar': true,
    'application/gzip': true,
  };

  // Get file extension
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Also check by extension for safety
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.json',
    '.mp3', '.wav', '.ogg', '.m4a',
    '.mp4', '.webm', '.avi', '.mov', '.wmv',
    '.zip', '.rar', '.7z', '.tar', '.gz'
  ];

  // Check MIME type first
  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
  } 
  // Fallback: check extension
  else if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } 
  else {
    const error = new Error(
      `File type "${file.mimetype}" (${ext}) is not allowed. ` +
      `Allowed types: Images (JPEG, PNG, GIF, etc.), Documents (PDF, DOC, XLS, etc.), ` +
      `Audio (MP3, WAV, etc.), Video (MP4, AVI, etc.), Archives (ZIP, RAR, etc.)`
    );
    error.code = 'FILE_TYPE_NOT_ALLOWED';
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size (adjust as needed)
  }
});

export const uploadSingleFile = (req, res, next) => {
  const uploadMiddleware = upload.single('file');
  
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error("❌ Multer error:", err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds the limit of 100MB'
        });
      }
      
      if (err.code === 'FILE_TYPE_NOT_ALLOWED') {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      
      return res.status(400).json({
        success: false,
        error: err.message || 'Error uploading file'
      });
    }
    
    // Log file info for debugging
    if (req.file) {
      console.log(`📁 File received: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);
    }
    
    next();
  });
};

export const uploadMultipleFiles = upload.array('files', 10);  

export const uploadSpecificField = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

export const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/'); // Create this folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

export const uploadDiskStorage = multer({
  storage: diskStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
}).single('file');