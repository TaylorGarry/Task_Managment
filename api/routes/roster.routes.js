// import express from "express";
// import { authMiddleware } from "../Middlewares/auth.middleware.js";
// import {
//   addRosterWeek,
//   getRosterForCRMUsers,
//   updateRoster,
//   exportRosterToExcel,
//   getAllRosters,
//   exportSavedRoster,
//   deleteEmployeeFromRoster,
//   deleteEmployeeByUserId,
//   deleteEmployeeByName,
//   createRosterForDateRange,
//   copyEmployeesToWeek,
//   bulkUpdateWeeks,
//   getRosterForBulkEdit,
//   bulkUpdateRosterWeeks,
//   getOpsMetaCurrentWeekRoster,
//   updateOpsMetaRoster,
//   rosterUploadFromExcel,
//   exportRosterTemplate,
// } from "../Controllers/roster.controller.js";
// import { validateRosterWeek } from "../Middlewares/roster.middleware.js";
// import { uploadSingleFile } from "../Middlewares/upload.middleware.js";
// import multer from "multer"; 
// const router = express.Router();

// router.post("/add-week", authMiddleware, validateRosterWeek, addRosterWeek);

// router.get("/getroster", authMiddleware, getRosterForCRMUsers);

// router.put("/update-employee", authMiddleware, updateRoster);

// router.get("/exportroster", authMiddleware, exportRosterToExcel);

// router.get("/rosterdetail", authMiddleware, getAllRosters);

// router.get("/export-saved", authMiddleware, exportSavedRoster);

// router.post('/delete-employee', authMiddleware, deleteEmployeeFromRoster);  
// router.post('/delete-employee-by-userid', authMiddleware, deleteEmployeeByUserId);  
// router.post('/delete-employee-by-name', authMiddleware, deleteEmployeeByName);

// router.post("/create-range", authMiddleware, createRosterForDateRange);

// router.post("/copy-employees", authMiddleware, copyEmployeesToWeek);

// router.post("/bulk-update", authMiddleware, bulkUpdateWeeks);

// router.get("/bulk-edit/:rosterId", authMiddleware, getRosterForBulkEdit);

// router.put("/bulk-save/:rosterId", authMiddleware, bulkUpdateRosterWeeks);

// router.get('/current-week', authMiddleware, getOpsMetaCurrentWeekRoster);

// router.put('/update',authMiddleware, updateOpsMetaRoster);

// router.post("/upload-excel", 
//   authMiddleware, 
//   (req, res, next) => {
//     const upload = multer({
//       storage: multer.memoryStorage(),
//       fileFilter: (req, file, cb) => {
//         const allowedMimeTypes = [
//           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//           'application/vnd.ms-excel'
//         ];
        
//         if (allowedMimeTypes.includes(file.mimetype) || 
//             file.originalname.match(/\.(xlsx|xls)$/)) {
//           cb(null, true);
//         } else {
//           cb(new Error('Only Excel files are allowed (.xlsx, .xls)'), false);
//         }
//       },
//       limits: {
//         fileSize: 10 * 1024 * 1024, 
//       }
//     }).single('excelFile');  
    
//     upload(req, res, (err) => {
//       if (err) {
//         return res.status(400).json({
//           success: false,
//           message: err.message || 'Error uploading Excel file'
//         });
//       }
//       next();
//     });
//   },
//   rosterUploadFromExcel
// );

// router.get('/export-template',authMiddleware, exportRosterTemplate);
// export default router;




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
  getRostersByDepartment,
} from "../Controllers/roster.controller.js";
import { validateRosterWeek } from "../Middlewares/roster.middleware.js";
import { uploadSingleFile } from "../Middlewares/upload.middleware.js";
import multer from "multer"; 
const router = express.Router();

// Add a new roster week
router.post("/add-week", authMiddleware, validateRosterWeek, addRosterWeek);

// Get roster details (for existing CRM users only)
router.get("/getroster", authMiddleware, getRosterForCRMUsers);

// Edit roster week details
router.put("/update-employee", authMiddleware, updateRoster);

// Export roster to Excel
router.get("/exportroster", authMiddleware, exportRosterToExcel);

router.get("/rosterdetail", authMiddleware, getAllRosters);

router.get("/export-saved", authMiddleware, exportSavedRoster);

router.post('/delete-employee', authMiddleware, deleteEmployeeFromRoster); // By employeeId
router.post('/delete-employee-by-userid', authMiddleware, deleteEmployeeByUserId); // By CRM userId
router.post('/delete-employee-by-name', authMiddleware, deleteEmployeeByName);

router.post("/create-range", authMiddleware, createRosterForDateRange);

// 2. Copy employees from one week to another week(s)
router.post("/copy-employees", authMiddleware, copyEmployeesToWeek);

// 3. Bulk update multiple weeks at once
router.post("/bulk-update", authMiddleware, bulkUpdateWeeks);

router.get("/bulk-edit/:rosterId", authMiddleware, getRosterForBulkEdit);

// 2. Save all changes across multiple weeks at once
router.put("/bulk-save/:rosterId", authMiddleware, bulkUpdateRosterWeeks);

// This roster is for Ops-Meta to display only current week roster
router.get('/current-week', authMiddleware, getOpsMetaCurrentWeekRoster);

//This is for update the roster of curent week only by OPS-Meta
router.put('/update',authMiddleware, updateOpsMetaRoster);

//This is for upload roster via excel file 
router.post("/upload-excel", 
  authMiddleware, 
  (req, res, next) => {
    // Custom middleware to handle file upload
    const upload = multer({
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        // Only allow Excel files
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
        fileSize: 10 * 1024 * 1024, // 10MB limit for Excel files
      }
    }).single('excelFile'); // Field name should be 'excelFile'
    
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
//new 
router.get('/by-department', authMiddleware, getRostersByDepartment);
export default router;
