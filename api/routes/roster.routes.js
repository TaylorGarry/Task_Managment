import express from "express";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import {
  addRosterWeek,
  getRosterForCRMUsers,
  updateRoster,
  exportRosterToExcel,
  getAllRosters,
  exportSavedRoster,
  deleteEmployeeFromRoster,
  deleteEmployeeByUserId,
  deleteEmployeeByName,
  createRosterForDateRange,
  copyEmployeesToWeek,
  bulkUpdateWeeks,
  getRosterForBulkEdit,
  bulkUpdateRosterWeeks,
  getOpsMetaCurrentWeekRoster,
  updateOpsMetaRoster,
  rosterUploadFromExcel,
  exportRosterTemplate,
} from "../Controllers/roster.controller.js";
import { validateRosterWeek } from "../Middlewares/roster.middleware.js";
import { uploadSingleFile } from "../Middlewares/upload.middleware.js";
import multer from "multer"; 
const router = express.Router();

router.post("/add-week", authMiddleware, validateRosterWeek, addRosterWeek);

router.get("/getroster", authMiddleware, getRosterForCRMUsers);

router.put("/update-employee", authMiddleware, updateRoster);

router.get("/exportroster", authMiddleware, exportRosterToExcel);

router.get("/rosterdetail", authMiddleware, getAllRosters);

router.get("/export-saved", authMiddleware, exportSavedRoster);

router.post('/delete-employee', authMiddleware, deleteEmployeeFromRoster);  
router.post('/delete-employee-by-userid', authMiddleware, deleteEmployeeByUserId);  
router.post('/delete-employee-by-name', authMiddleware, deleteEmployeeByName);

router.post("/create-range", authMiddleware, createRosterForDateRange);

router.post("/copy-employees", authMiddleware, copyEmployeesToWeek);

router.post("/bulk-update", authMiddleware, bulkUpdateWeeks);

router.get("/bulk-edit/:rosterId", authMiddleware, getRosterForBulkEdit);

router.put("/bulk-save/:rosterId", authMiddleware, bulkUpdateRosterWeeks);

router.get('/current-week', authMiddleware, getOpsMetaCurrentWeekRoster);

router.put('/update',authMiddleware, updateOpsMetaRoster);

router.post("/upload-excel", 
  authMiddleware, 
  (req, res, next) => {
    const upload = multer({
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype) || 
            file.originalname.match(/\.(xlsx|xls)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only Excel files are allowed (.xlsx, .xls)'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, 
      }
    }).single('excelFile');  
    
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading Excel file'
        });
      }
      next();
    });
  },
  rosterUploadFromExcel
);

router.get('/export-template',authMiddleware, exportRosterTemplate);
export default router;
