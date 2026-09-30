import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TablePagination,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress,
  IconButton, InputAdornment, Box, Chip, Typography,
  Avatar, Divider, Stack, Alert, LinearProgress,
  Collapse, Tooltip
} from "@mui/material";
import {
  Close, Visibility, VisibilityOff, Upload, Delete,
  RemoveRedEye, Download, Edit, MoreVert, CheckCircle,
  Cancel, Business, AccessTime, Description, Security,
  Person, Badge, Work, People, FileCopy, Save,
  FolderOpen, PictureAsPdf, Image, Description as DocIcon,
  School, LocationOn, CreditCard, Receipt, Assignment, CameraAlt,
  Campaign
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import DialogBox from "./Dialogbox";
import StyledDatePicker from "./StyledDatePicker.jsx";
import SignaturePadCanvas from "./SignaturePadCanvas.jsx";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployees,
  updateUserByAdmin,
  fetchReportingManagers,
  uploadEmployeeAsset,
  hrSignPolicyDocument,
  deleteEmployeeByAdmin,
  exportEmployeesExcel,
} from "../features/slices/authSlice.js";
import ConfirmActionModal from "./ConfirmActionModal.jsx";
import toast from "react-hot-toast";
import { DESIGNATION_OPTIONS } from "../constants/designationOptions.js";

const shiftOptions = [
  { label: "1am-10am", value: "1am-10am" },
  { label: "4pm-1am", value: "4pm-1am" },
  { label: "5pm-2am", value: "5pm-2am" },
  { label: "6pm-3am", value: "6pm-3am" },
  { label: "8pm-5am", value: "8pm-5am" },
  { label: "11pm-8am", value: "11pm-8am"}
];

const SHIFT_LABEL_VALUES = new Set(shiftOptions.map((s) => s.value));
const STATIC_POLICY_DOCS = [
  "/policies/Leave Policy.pdf",
  "/policies/IT Usage Policy.pdf",
  "/policies/Exit Policy 1.1.pdf",
  "/policies/Data Security Agreement.pdf",
  "/policies/Code of Conduct.pdf",
];
const LEGACY_POLICY_DOC = "/policy-sample.txt";
const normalizePolicyKey = (value = "") => {
  const raw = String(value || "").trim().split("?")[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
const PREVIOUS_EMPLOYMENT_DOC_IDS = new Set([
  "previous_appointment",
  "previous_salary_slips",
  "relieving_letter",
  "resignation_acceptance",
]);

const getShiftLabel = (start, end) => {
  if (start === undefined || end === undefined || start === null || end === null)
    return "N/A";

  const formatHour = (hour) => {
    const suffix = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}${suffix}`;
  };
  return `${formatHour(start)}-${formatHour(end)}`;
};

// Predefined document categories with separate Appointment Letter and Offer Letter
const DOCUMENT_CATEGORIES = [
  { id: "resume", name: "Resume", icon: <Description />, required: true, category: "Personal" },
  { id: "photo", name: "Photo", icon: <Image />, required: true, category: "Personal" },
  { id: "aadhaar", name: "Aadhaar Card", icon: <CreditCard />, required: true, category: "Identity" },
  { id: "pan", name: "PAN Card", icon: <CreditCard />, required: true, category: "Identity" },
  { id: "current_address", name: "Current Address Proof", icon: <LocationOn />, required: true, category: "Address" },
  { id: "permanent_address", name: "Permanent Address Proof", icon: <LocationOn />, required: true, category: "Address" },
  { id: "10th_marksheet", name: "10th Marksheet", icon: <School />, required: false, category: "Education" },
  { id: "12th_marksheet", name: "12th Marksheet", icon: <School />, required: false, category: "Education" },
  { id: "graduation_marksheet", name: "Graduation/Post Graduation Marksheet", icon: <School />, required: false, category: "Education" },
  { id: "additional_certificate", name: "Additional Certificate", icon: <Assignment />, required: false, category: "Education" },
  { id: "cancelled_cheque", name: "Cancelled Cheque", icon: <Receipt />, required: true, category: "Bank" },
  { id: "bank_statement", name: "Bank Statement (Last 3 Months)", icon: <Receipt />, required: true, category: "Bank" },
  { id: "previous_appointment", name: "Previous Company - Appointment Letter", icon: <Assignment />, required: false, category: "Previous Employment" },
  { id: "previous_salary_slips", name: "Previous Company - Last 3 Months Salary Slip", icon: <Receipt />, required: false, category: "Previous Employment" },
  { id: "relieving_letter", name: "Relieving/Experience Letter", icon: <Assignment />, required: false, category: "Previous Employment" },
  { id: "resignation_acceptance", name: "Resignation Acceptance", icon: <Assignment />, required: false, category: "Previous Employment" },
  { id: "offer_letter", name: "Offer Letter", icon: <Campaign />, required: true, category: "Current Employment" },
  { id: "appointment_letter", name: "Appointment Letter", icon: <Assignment />, required: true, category: "Current Employment" }
];

const PREVIOUS_EMPLOYMENT_DOC_NAMES = new Set(
  DOCUMENT_CATEGORIES
    .filter((doc) => PREVIOUS_EMPLOYMENT_DOC_IDS.has(doc.id))
    .map((doc) => String(doc.name || "").trim().toLowerCase())
);

const isPreviousEmploymentDoc = (name = "") =>
  PREVIOUS_EMPLOYMENT_DOC_NAMES.has(String(name || "").trim().toLowerCase());

const parseOptionalAmount = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: "24px",
  border: "1px solid #eef2f6",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.05)",
  },
}));

const ManageEmployee = () => {
  const dispatch = useDispatch();
  const { employees, loading, reportingManagers = [], user: currentUser } = useSelector((state) => state.auth);
  const [openDialogBox, setOpenDialogBox] = useState(false)
  const [localEmployees, setLocalEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [formData, setFormData] = useState({
    username: "",
    realName: "",
    pseudoName: "",
    empId: "",
    dateOfJoining: "",
    designation: "",
    officeLocation: "",
    department: "",
    transportOffice: "No",
    docsStatus: "No",
    employmentType: "experienced",
    profilePhotoUrl: "",
    profilePhotoPublicId: "",
    ctc: "",
    inHandSalary: "",
    transportAllowance: "",
    reportingManager: "",
    shiftLabel: "",
    isCoreTeam: false,
    isTeamLeader: false,
    isActive: true,
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [documents, setDocuments] = useState({});
  const [policyDocuments, setPolicyDocuments] = useState([]);
  const [hrSignModal, setHrSignModal] = useState({ open: false, doc: null, party: "hr" });
  const [hrSignatureDataUrl, setHrSignatureDataUrl] = useState("");
  const [hrSignatureHasStroke, setHrSignatureHasStroke] = useState(false);
  const [savingHrSignature, setSavingHrSignature] = useState(false);
  const [uploadStates, setUploadStates] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [grantingOverride, setGrantingOverride] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [overrideClockNow, setOverrideClockNow] = useState(Date.now());
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [isExportingEmployees, setIsExportingEmployees] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const sections = [
    { id: "basic", label: "Basic Info", icon: <Person sx={{ fontSize: 18 }} /> },
    { id: "work", label: "Work Details", icon: <Work sx={{ fontSize: 18 }} /> },
    { id: "documents", label: "Documents", icon: <Description sx={{ fontSize: 18 }} /> },
    { id: "security", label: "Security", icon: <Security sx={{ fontSize: 18 }} /> }
  ];

  const isHrUser = currentUser?.accountType === "HR";
  const isSuperAdmin = currentUser?.accountType === "superAdmin";
  const isSelectedUserInactive = selectedUser?.isActive === false;
  const canManagePayroll = isHrUser || isSuperAdmin;
  const isFresher = formData.employmentType === "fresher";
  const isHrOverrideActive = Boolean(
    selectedUser?.hrDocumentOverrideUntil &&
      new Date(selectedUser.hrDocumentOverrideUntil).getTime() > Date.now()
  );
  const isHrGlobalOverrideActive = Boolean(
    currentUser?.hrGlobalDocumentOverrideUntil &&
      new Date(currentUser.hrGlobalDocumentOverrideUntil).getTime() > Date.now()
  );

  const groupedDocuments = useMemo(() => {
    const visibleDocs = DOCUMENT_CATEGORIES.filter((doc) =>
      isFresher ? !PREVIOUS_EMPLOYMENT_DOC_IDS.has(doc.id) : true
    );
    return visibleDocs.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    }, {});
  }, [isFresher]);

  const visibleDocCategories = useMemo(() => Object.entries(groupedDocuments), [groupedDocuments]);
  const totalVisibleDocs = useMemo(() => visibleDocCategories.reduce((sum, [, docs]) => sum + docs.length, 0), [visibleDocCategories]);

  const getDocRequired = (doc) =>
    PREVIOUS_EMPLOYMENT_DOC_IDS.has(doc.id) ? formData.employmentType === "experienced" : doc.required;

  const isDocLockedForHr = (doc) => {
    if (!isHrUser) return false;
    if (isHrOverrideActive || isHrGlobalOverrideActive) return false;
    return Boolean(doc && (doc.uploaded || doc.url));
  };

  useEffect(() => {
    if (!loadedOnce) {
      dispatch(fetchEmployees())
        .unwrap()
        .then((data) => {
          setLocalEmployees(data);
          setLoadedOnce(true);
        })
        .catch(() => toast.error("Failed to load employees"));
    }
  }, [dispatch, loadedOnce]);

  useEffect(() => {
    dispatch(fetchReportingManagers("Ops - Meta"));
  }, [dispatch]);

  useEffect(() => {
    if (formData.department) {
      dispatch(fetchReportingManagers(formData.department));
    }
  }, [dispatch, formData.department]);

  useEffect(() => {
    if (!selectedUser) return;
    const timer = setInterval(() => {
      setOverrideClockNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedUser]);

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setActiveSection("basic");
    setFormData({
      username: user.username,
      realName: user.realName || "",
      pseudoName: user.pseudoName || "",
      empId: user.empId || "",
      dateOfJoining: user.dateOfJoining ? new Date(user.dateOfJoining).toISOString().split("T")[0] : "",
      designation: user.designation || "",
      officeLocation: user.officeLocation || "",
      department: user.department || "",
      transportOffice: user.transportOffice || "No",
      docsStatus: user.docsStatus || "No",
      employmentType: user.employmentType || "experienced",
      profilePhotoUrl: user.profilePhotoUrl || "",
      profilePhotoPublicId: user.profilePhotoPublicId || "",
      ctc: user.ctc ?? "",
      inHandSalary: user.inHandSalary ?? "",
      transportAllowance: user.transportAllowance ?? "",
      reportingManager: user.reportingManager?._id || user.reportingManager || "",
      shiftLabel: (() => {
        const rawShift = String(
          user.shiftLabel || getShiftLabel(user.shiftStartHour, user.shiftEndHour) || ""
        ).trim();
        return SHIFT_LABEL_VALUES.has(rawShift) ? rawShift : "";
      })(),
      isCoreTeam: user.isCoreTeam || false,
      isTeamLeader: Boolean(user.isTeamLeader),
      isActive: user.isActive !== false,
      password: "",
      confirmPassword: ""
    });
    
    // Initialize documents object with existing documents
    const docsObj = {};
    DOCUMENT_CATEGORIES.forEach(cat => {
      const existingDoc = user.documents?.find(doc => doc.name === cat.name);
      if (existingDoc) {
        docsObj[cat.id] = existingDoc;
      } else {
        docsObj[cat.id] = null;
      }
    });
    setDocuments(docsObj);
    const existingPolicyDocs = Array.isArray(user.policyDocuments) ? user.policyDocuments.filter(Boolean) : [];
    const docUrls =
      existingPolicyDocs.length === 0 || existingPolicyDocs.every((doc) => String(doc || "").trim() === LEGACY_POLICY_DOC)
        ? STATIC_POLICY_DOCS
        : existingPolicyDocs;
    setPolicyDocuments(
      docUrls.map((url, idx) => ({
        name: url.split("/").pop() || `Policy ${idx + 1}`,
        url,
        signatureStatus:
          user.policySignatures?.find(
            (sig) => normalizePolicyKey(sig?.documentUrl || "") === normalizePolicyKey(url || "")
          ) || null,
      }))
    );
    setPreviewDoc(null);
    setHrSignModal({ open: false, doc: null, party: "hr" });
    setHrSignatureDataUrl("");
    setHrSignatureHasStroke(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleCloseDialog = () => {
    closeCamera();
    setSelectedUser(null);
    setActiveSection("basic");
    setFormData({
      username: "",
      realName: "",
      pseudoName: "",
      empId: "",
      dateOfJoining: "",
      designation: "",
      officeLocation: "",
      department: "",
      transportOffice: "No",
      docsStatus: "No",
      employmentType: "experienced",
      profilePhotoUrl: "",
      profilePhotoPublicId: "",
      ctc: "",
      inHandSalary: "",
      transportAllowance: "",
      reportingManager: "",
      shiftLabel: "",
      isCoreTeam: false,
      isTeamLeader: false,
      isActive: true,
      password: "",
      confirmPassword: ""
    });
    setDocuments({});
    setPolicyDocuments([]);
    setPreviewDoc(null);
    setHrSignModal({ open: false, doc: null, party: "hr" });
    setHrSignatureDataUrl("");
    setHrSignatureHasStroke(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (name === "employmentType" && nextValue === "fresher") {
      setDocuments((prev) => {
        const next = { ...prev };
        for (const docId of PREVIOUS_EMPLOYMENT_DOC_IDS) {
          next[docId] = null;
        }
        return next;
      });
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera is not supported in this browser");
      return;
    }
    setCameraOpen(true);
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      toast.error("Unable to access camera. Please allow permission.");
      setCameraOpen(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const closeCamera = () => {
    stopCameraStream();
    setCameraOpen(false);
  };

  const captureProfilePhoto = async () => {
    if (!videoRef.current || !selectedUser?._id) {
      toast.error("Camera not ready");
      return;
    }
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (!width || !height) {
      toast.error("Camera frame unavailable");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Unable to capture image");
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setUploadingProfilePhoto(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const photoFile = new File(
        [blob],
        `${formData.empId || formData.username || "employee"}_profile_${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );
      const asset = await dispatch(
        uploadEmployeeAsset({ file: photoFile, assetType: "profile-photo" })
      ).unwrap();
      setFormData((prev) => ({
        ...prev,
        profilePhotoUrl: asset.url || "",
        profilePhotoPublicId: asset.publicId || "",
      }));
      setDocuments((prev) => ({
        ...prev,
        photo: {
          name: "Photo",
          url: asset.url || "",
          publicId: asset.publicId || "",
          fileName: asset.originalName || photoFile.name || "",
          mimeType: asset.mimeType || photoFile.type || "",
          size: asset.bytes || photoFile.size || 0,
          uploaded: true,
          uploadedAt: new Date().toISOString(),
          uploadedIp: asset.uploadedIp || "",
        },
      }));
      toast.success("Profile photo captured and uploaded");
      closeCamera();
    } catch (err) {
      toast.error(err || "Failed to upload profile photo");
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const downloadEmployeeIdCard = async () => {
    const employeeName = formData.realName || selectedUser?.realName || selectedUser?.username || "Employee";
    const designation = formData.designation || selectedUser?.designation || "";
    const empId = formData.empId || selectedUser?.empId || "";
    const photoUrl = formData.profilePhotoUrl || selectedUser?.profilePhotoUrl || "";

    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 620;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Unable to generate ID card");
      return;
    }

    ctx.fillStyle = "#f9fbff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#022b68";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 120);
    ctx.quadraticCurveTo(180, 95, 250, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f2b318";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 80);
    ctx.quadraticCurveTo(145, 62, 220, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#022b68";
    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, canvas.height - 140);
    ctx.quadraticCurveTo(canvas.width - 260, canvas.height - 122, canvas.width - 360, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f2b318";
    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, canvas.height - 95);
    ctx.quadraticCurveTo(canvas.width - 210, canvas.height - 85, canvas.width - 320, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f2b318";
    ctx.fillRect(72, 185, 86, 56);
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 40px Arial";
    ctx.fillText("FD", 82, 226);
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 56px Arial";
    ctx.fillText("BUSINESS", 172, 231);
    ctx.fillStyle = "#b8860b";
    ctx.font = "700 42px Arial";
    ctx.fillText("Service Private Limited", 174, 278);

    const photoX = 95;
    const photoY = 315;
    const photoSize = 230;
    ctx.fillStyle = "#dbe4f0";
    ctx.beginPath();
    ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 10, 0, Math.PI * 2);
    ctx.fill();

    if (photoUrl) {
      try {
        const photo = await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = photoUrl;
        });
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(photo, photoX, photoY, photoSize, photoSize);
        ctx.restore();
      } catch {
        // fallback text when image loading fails
      }
    }

    if (!photoUrl) {
      ctx.fillStyle = "#64748b";
      ctx.font = "600 24px Arial";
      ctx.fillText("No Photo", photoX + 55, photoY + 125);
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "700 58px Arial";
    ctx.fillText(employeeName, 370, 400);

    ctx.fillStyle = "#111827";
    ctx.font = "600 46px Arial";
    ctx.fillText(designation || "Employee", 370, 462);

    ctx.fillStyle = "#1f2937";
    ctx.font = "600 42px Arial";
    ctx.fillText(`Emp ID : ${empId || "N/A"}`, 370, 528);

    const link = document.createElement("a");
    const safeName = String(employeeName || "employee").replace(/[^a-z0-9_-]+/gi, "_");
    link.download = `${safeName}_id_card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleFileSelect = (categoryId) => {
    const fileInput = document.getElementById(`file-input-${categoryId}`);
    if (fileInput) {
      fileInput.click();
    }
  };

  const uploadDocument = async (categoryId, file) => {
    const category = DOCUMENT_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return;

    if (!file) {
      toast.error("Please choose a file");
      return;
    }

    try {
      setUploadStates(prev => ({ ...prev, [categoryId]: true }));
      const asset = await dispatch(uploadEmployeeAsset({ file, assetType: "document" })).unwrap();
      
      setDocuments(prev => ({
        ...prev,
        [categoryId]: {
          name: category.name,
          url: asset.url,
          publicId: asset.publicId || "",
          fileName: asset.originalName || file.name || "",
          mimeType: asset.mimeType || file.type || "",
          size: asset.bytes || file.size || 0,
          uploaded: true,
          uploadedAt: new Date().toISOString(),
          uploadedIp: asset.uploadedIp || "",
        }
      }));
      
      toast.success(`${category.name} uploaded successfully`);
    } catch (err) {
      toast.error(err || `Failed to upload ${category.name}`);
    } finally {
      setUploadStates(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const removeDocument = (categoryId) => {
    setDocuments(prev => ({
      ...prev,
      [categoryId]: null
    }));
    toast.success("Document removed");
  };

  const submitHrSignature = async () => {
    if (!selectedUser?._id || !hrSignModal.doc?.url) {
      toast.error("Missing policy details");
      return;
    }
    if (!hrSignatureHasStroke || !hrSignatureDataUrl) {
      toast.error("Please add HR signature");
      return;
    }
    setSavingHrSignature(true);
    try {
      const result = await dispatch(
        hrSignPolicyDocument({
          userId: selectedUser._id,
          documentUrl: hrSignModal.doc.url,
          signatureDataUrl: hrSignatureDataUrl,
          party: hrSignModal.party,
        })
      ).unwrap();

      const signatures = Array.isArray(result?.policySignatures) ? result.policySignatures : [];
      setPolicyDocuments((prev) =>
        prev.map((doc) => ({
          ...doc,
          signatureStatus:
            signatures.find(
              (sig) => normalizePolicyKey(sig?.documentUrl || "") === normalizePolicyKey(doc.url || "")
            ) || doc.signatureStatus,
        }))
      );
      const updatedSelected = {
        ...selectedUser,
        policySignatures: signatures,
        policyAgreement: result?.policyAgreement || selectedUser.policyAgreement,
      };
      setSelectedUser(updatedSelected);
      setLocalEmployees((prev) =>
        prev.map((u) =>
          String(u._id) === String(selectedUser._id)
            ? {
                ...u,
                policySignatures: signatures,
                policyAgreement: result?.policyAgreement || u.policyAgreement,
              }
            : u
        )
      );
      setHrSignModal({ open: false, doc: null, party: "hr" });
      setHrSignatureDataUrl("");
      setHrSignatureHasStroke(false);
      toast.success(hrSignModal.party === "employee" ? "Employee signature saved" : "HR signature saved");
    } catch (err) {
      toast.error(err || "Failed to save HR signature");
    } finally {
      setSavingHrSignature(false);
    }
  };

  const handleSetHrOverride = async (enabled) => {
    if (!selectedUser?._id || !isSuperAdmin) return;
    setGrantingOverride(true);
    try {
      const isGrantingGlobalToHr = selectedUser?.accountType === "HR";
      const result = await dispatch(
        updateUserByAdmin({
          userId: selectedUser._id,
          updateData: {
            ...(isGrantingGlobalToHr
              ? { allowHrDocumentEditGlobal: enabled }
              : { allowHrDocumentEdit: enabled }),
            hrDocumentOverrideMinutes: 30,
          },
        })
      ).unwrap();

      setSelectedUser(result.user);
      setLocalEmployees((prev) =>
        prev.map((u) => (String(u._id) === String(result.user._id) ? { ...u, ...result.user } : u))
      );
      toast.success(enabled ? "Re-upload permission granted for 30 minutes" : "Re-upload permission revoked");
    } catch (err) {
      toast.error(err || "Failed to update override");
    } finally {
      setGrantingOverride(false);
    }
  };

  const formatRemaining = (until) => {
    if (!until) return "00:00";
    const diffMs = new Date(until).getTime() - overrideClockNow;
    if (diffMs <= 0) return "00:00";
    const totalSec = Math.floor(diffMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const confirmDeleteEmployee = async () => {
    if (!deleteTarget?._id) return;
    setDeletingEmployee(true);
    try {
      const result = await dispatch(deleteEmployeeByAdmin({ userId: deleteTarget._id })).unwrap();
      setLocalEmployees((prev) => prev.filter((u) => String(u._id) !== String(deleteTarget._id)));
      if (selectedUser && String(selectedUser._id) === String(deleteTarget._id)) {
        handleCloseDialog();
      }
      setDeleteTarget(null);
      toast.success(result?.message || "Employee deleted successfully");
    } catch (err) {
      toast.error(err || "Failed to delete employee");
    } finally {
      setDeletingEmployee(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (formData.password || formData.confirmPassword) {
        if (!formData.password || !formData.confirmPassword) {
          toast.error("Both password fields are required for password reset");
          setIsSaving(false);
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setIsSaving(false);
          return;
        }
        
        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters long");
          setIsSaving(false);
          return;
        }
      }

      let shiftStartHour = null;
      let shiftEndHour = null;

      if (formData.shiftLabel && SHIFT_LABEL_VALUES.has(formData.shiftLabel)) {
        const [start, end] = formData.shiftLabel.split("-");
        const parseHour = (str) => {
          if (!str) return null;
          const hour = parseInt(str, 10);
          if (Number.isNaN(hour)) return null;
          const token = String(str).toLowerCase();
          const isPM = token.includes("pm");
          return isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour;
        };
        shiftStartHour = parseHour(start);
        shiftEndHour = parseHour(end);
      }

      const documentsArray = Object.values(documents).filter((doc) => doc !== null);
      const requiredPreviousEmploymentDocs = DOCUMENT_CATEGORIES.filter((doc) =>
        PREVIOUS_EMPLOYMENT_DOC_IDS.has(doc.id)
      );
      const hasAllPreviousEmploymentDocs =
        formData.employmentType === "fresher" ||
        requiredPreviousEmploymentDocs.every((doc) => Boolean(documents[doc.id]));
      const docsStatusValue =
        formData.employmentType === "experienced" && !hasAllPreviousEmploymentDocs
          ? "Pending"
          : documentsArray.length > 0
          ? "Yes"
          : formData.docsStatus;

      const updateData = {
        username: formData.username,
        realName: formData.realName,
        pseudoName: formData.pseudoName,
        empId: formData.empId,
        dateOfJoining: formData.dateOfJoining || null,
        designation: formData.designation,
        officeLocation: formData.officeLocation,
        department: formData.department,
        transportOffice: formData.transportOffice,
        docsStatus: docsStatusValue,
        employmentType: formData.employmentType,
        profilePhotoUrl: formData.profilePhotoUrl || "",
        profilePhotoPublicId: formData.profilePhotoPublicId || "",
        ctc: parseOptionalAmount(formData.ctc),
        inHandSalary: parseOptionalAmount(formData.inHandSalary),
        transportAllowance: parseOptionalAmount(formData.transportAllowance),
        reportingManager: formData.reportingManager || null,
        documents: documentsArray,
        policyDocuments: STATIC_POLICY_DOCS,
        isCoreTeam: formData.isCoreTeam,
        isTeamLeader: formData.isTeamLeader,
        isActive: formData.isActive,
        shiftLabel: formData.shiftLabel,
        shiftStartHour,
        shiftEndHour,
      };

      if (formData.password) {
        updateData.password = formData.password;
        updateData.confirmPassword = formData.confirmPassword;
      }

      const result = await dispatch(
        updateUserByAdmin({ userId: selectedUser._id, updateData })
      ).unwrap();

      if (formData.password) {
        toast.success("Employee updated and password reset successfully!");
      } else {
        toast.success("Employee updated successfully!");
      }

      setLocalEmployees((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? { ...u, ...result.user } : u))
      );

      handleCloseDialog();
      setOpenDialogBox(true);
    } catch (err) {
      toast.error(err || "Failed to update employee");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getDocumentStatusText = (doc, required) => {
    if (doc) return "Uploaded";
    return required ? "Pending" : "Optional";
  };

  const handleExportEmployeeDetails = async () => {
    try {
      setIsExportingEmployees(true);
      const { blob, fileName } = await dispatch(exportEmployeesExcel()).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "Employee_Details.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Employee details exported");
    } catch (err) {
      toast.error(err || "Failed to export employee details");
    } finally {
      setIsExportingEmployees(false);
    }
  };

  if (loading && localEmployees.length === 0)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <CircularProgress size={40} sx={{ color: "#3b82f6" }} />
          <p className="mt-3 text-sm text-slate-500">Loading employees...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 px-8 py-6 sm:px-6 lg:px-8">
  {/* Employee Table */}
  <StyledCard>
    <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "#eaeaea" }}>
      <div>
        <p className="text-sm font-semibold text-slate-800">Employee Details</p>
        <p className="text-xs text-slate-500">Export complete employee data with document status columns</p>
      </div>
      <Button
        variant="contained"
        size="small"
        onClick={handleExportEmployeeDetails}
        disabled={isExportingEmployees}
        startIcon={isExportingEmployees ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <Download sx={{ fontSize: 16 }} />}
        sx={{
          textTransform: "none",
          borderRadius: "10px",
          backgroundColor: "#2563eb",
          "&:hover": { backgroundColor: "#1d4ed8" },
        }}
      >
        {isExportingEmployees ? "Exporting..." : "Export Employee Details"}
      </Button>
    </div>
    <TableContainer>
      <Table>
        <TableHead>
            <TableRow sx={{ backgroundColor: "#fafcff" }}>
              <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>Office Location</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>Shift</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#1e293b" }} align="center">Action</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
          {localEmployees
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((user) => (
              <TableRow
                key={user._id}
                hover
                sx={{ "&:hover": { backgroundColor: "#fafcff" } }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.profilePhotoUrl || ""}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "#eff6ff",
                        color: "#3b82f6",
                        fontWeight: 600
                      }}
                    >
                      {user.realName?.charAt(0) || user.username?.charAt(0) || "U"}
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{user.realName || user.username}</p>
                      <p className="text-xs text-slate-500">@{user.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm text-slate-600">{user.empId || "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {user.department || "N/A"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{user.designation || "—"}</TableCell>
                <TableCell className="text-sm text-slate-600">{user.officeLocation || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <AccessTime sx={{ fontSize: 14, color: "#f59e0b" }} />
                    <span className="text-sm text-slate-600">
                      {user.shiftLabel || getShiftLabel(user.shiftStartHour, user.shiftEndHour) || "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive === false
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {user.isActive === false ? "Inactive" : "Active"}
                    </span>
                    {user.isCoreTeam && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        Core
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell align="center">
                  <div className="flex items-center justify-center gap-1">
                    <IconButton
                      onClick={() => handleOpenDialog(user)}
                      sx={{
                        color: "#64748b",
                        "&:hover": { backgroundColor: "#eff6ff", color: "#3b82f6" }
                      }}
                    >
                      <Edit sx={{ fontSize: 20 }} />
                    </IconButton>
                    {isSuperAdmin && (
                      <IconButton
                        onClick={() => setDeleteTarget(user)}
                        sx={{
                          color: "#ef4444",
                          "&:hover": { backgroundColor: "#fef2f2", color: "#dc2626" }
                        }}
                      >
                        <Delete sx={{ fontSize: 19 }} />
                      </IconButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component="div"
      count={localEmployees.length}
      page={page}
      onPageChange={(e, newPage) => setPage(newPage)}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
      sx={{ borderTop: "1px solid #eaeaea" }}
    />
  </StyledCard>

  {/* Modern Edit Dialog */}
  <Dialog
    open={!!selectedUser}
    onClose={handleCloseDialog}
    fullWidth
    maxWidth="lg"
    PaperProps={{
      sx: {
        borderRadius: "32px",
        overflow: "hidden",
        height: "auto",
        maxHeight: "90vh",
      },
    }}
  >
    {/* Header */}
    <div className="bg-white px-6 py-5 border-b" style={{ borderBottomColor: "#eaeaea" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={formData.profilePhotoUrl || selectedUser?.profilePhotoUrl || ""}
            sx={{
              width: 48,
              height: 48,
              bgcolor: "#3b82f6",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)"
            }}
          >
            <Edit sx={{ fontSize: 24 }} />
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Edit Employee</h2>
            <p className="text-sm text-slate-500">
              {selectedUser?.realName || selectedUser?.username}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Badge />}
            onClick={downloadEmployeeIdCard}
            sx={{ textTransform: "none", borderRadius: "10px", borderColor: "#e2e8f0" }}
          >
            Download ID Card
          </Button>
          <IconButton onClick={handleCloseDialog} sx={{ color: "#94a3b8" }}>
            <Close />
          </IconButton>
        </div>
      </div>
    </div>

    {/* Section Navigation */}
    <div className="bg-slate-50/50 px-6 py-3 border-b" style={{ borderBottomColor: "#eaeaea" }}>
      <div className="flex gap-1 overflow-x-auto">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
              activeSection === section.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>
    </div>

    {/* Content */}
    <DialogContent sx={{ p: 0, overflowY: "auto", maxHeight: "calc(90vh - 180px)" }}>
      {isSelectedUserInactive && (
        <div className="px-6 pt-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <label className="block text-xs font-medium text-amber-800 mb-1.5">Account Status</label>
            <TextField
              select
              fullWidth
              name="isActive"
              value={formData.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: e.target.value === "active",
                }))
              }
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                  "& fieldset": {
                    borderColor: "#f3d190",
                  },
                  "&:hover fieldset": {
                    borderColor: "#eab308",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#d97706",
                    borderWidth: "2px",
                  },
                },
              }}
            >
              <MenuItem value="active" disabled={!isSuperAdmin}>Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </div>
        </div>
      )}
      <fieldset
        disabled={isSelectedUserInactive}
        className={`border-0 m-0 min-w-0 p-0 ${isSelectedUserInactive ? "pointer-events-none select-none opacity-70" : ""}`}
      >
      {/* Basic Info Section */}
      {activeSection === "basic" && (
        <div className="p-6">
          <div
            className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border p-4"
            style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
          >
            <Avatar
              src={formData.profilePhotoUrl || ""}
              sx={{ width: 88, height: 88, bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 700 }}
            >
              {(formData.realName || formData.username || "U").charAt(0)}
            </Avatar>
            <div className="flex-1 min-w-[220px]">
              <p className="text-sm font-semibold text-slate-800">Employee Profile Photo</p>
              <p className="text-xs text-slate-500 mt-1">
                Capture photo using local camera. Photo is uploaded to Cloudinary and URL is saved in DB.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CameraAlt />}
                  onClick={openCamera}
                  disabled={uploadingProfilePhoto}
                  sx={{ textTransform: "none", borderRadius: "10px" }}
                >
                  Capture Photo
                </Button>
                {formData.profilePhotoUrl && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        profilePhotoUrl: "",
                        profilePhotoPublicId: "",
                      }))
                    }
                    sx={{ textTransform: "none", borderRadius: "10px", borderColor: "#e2e8f0" }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Username</label>
              <TextField
                fullWidth
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#eaeaea",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: "2px",
                    },
                  },
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Employee ID</label>
              <TextField
                fullWidth
                name="empId"
                value={formData.empId}
                onChange={handleChange}
                size="small"
                placeholder="EMP001"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#eaeaea",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: "2px",
                    },
                  },
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Real Name</label>
              <TextField
                fullWidth
                name="realName"
                value={formData.realName}
                onChange={handleChange}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#eaeaea",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: "2px",
                    },
                  },
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Pseudo Name</label>
              <TextField
                fullWidth
                name="pseudoName"
                value={formData.pseudoName}
                onChange={handleChange}
                size="small"
                placeholder="Optional"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#eaeaea",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: "2px",
                    },
                  },
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Designation</label>
              <TextField
                select
                fullWidth
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                size="small"
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 260 },
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#eaeaea",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: "2px",
                    },
                  },
                }}
              >
                <MenuItem value="">Select designation</MenuItem>
                {DESIGNATION_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Date of Joining</label>
              <StyledDatePicker
                value={formData.dateOfJoining}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateOfJoining: val,
                  }))
                }
                placeholder="Select joining date"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Office Location</label>
              <TextField
                fullWidth
                name="officeLocation"
                value={formData.officeLocation}
                onChange={handleChange}
                size="small"
                placeholder="Enter office location"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#eaeaea",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: "2px",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

{activeSection === "work" && (
  <div className="p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Department</label>
        <TextField
          fullWidth
          name="department"
          value={formData.department}
          onChange={handleChange}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": {
                borderColor: "#eaeaea",
              },
              "&:hover fieldset": {
                borderColor: "#cbd5e1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
                borderWidth: "2px",
              },
            },
          }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Status</label>
        <TextField
          select
          fullWidth
          name="isActive"
          value={formData.isActive ? "active" : "inactive"}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              isActive: e.target.value === "active",
            }))
          }
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": {
                borderColor: "#eaeaea",
              },
              "&:hover fieldset": {
                borderColor: "#cbd5e1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
                borderWidth: "2px",
              },
            },
          }}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Reporting Manager</label>
        <TextField
          select
          fullWidth
          name="reportingManager"
          value={formData.reportingManager}
          onChange={handleChange}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": {
                borderColor: "#eaeaea",
              },
              "&:hover fieldset": {
                borderColor: "#cbd5e1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
                borderWidth: "2px",
              },
            },
          }}
        >
          <MenuItem value="">— None —</MenuItem>
          {reportingManagers.map((manager) => (
            <MenuItem key={manager._id} value={manager._id}>
              {manager.realName ? `${manager.realName} (${manager.username})` : manager.username}
            </MenuItem>
          ))}
        </TextField>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Shift Timing</label>
        <TextField
          select
          fullWidth
          name="shiftLabel"
          value={formData.shiftLabel}
          onChange={handleChange}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": {
                borderColor: "#eaeaea",
              },
              "&:hover fieldset": {
                borderColor: "#cbd5e1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
                borderWidth: "2px",
              },
            },
          }}
        >
          {shiftOptions.map((shift) => (
            <MenuItem key={shift.value} value={shift.value}>
              {shift.label}
            </MenuItem>
          ))}
        </TextField>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Transport Office</label>
        <TextField
          select
          fullWidth
          name="transportOffice"
          value={formData.transportOffice}
          onChange={handleChange}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": {
                borderColor: "#eaeaea",
              },
              "&:hover fieldset": {
                borderColor: "#cbd5e1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
                borderWidth: "2px",
              },
            },
          }}
        >
          <MenuItem value="No">Not Required</MenuItem>
          <MenuItem value="Yes">Required</MenuItem>
        </TextField>
      </div>
      {canManagePayroll && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">CTC</label>
            <TextField
              fullWidth
              name="ctc"
              value={formData.ctc}
              onChange={handleChange}
              size="small"
              type="number"
              placeholder="Enter CTC amount"
              inputProps={{ min: 0, step: "0.01" }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "& fieldset": {
                    borderColor: "#eaeaea",
                  },
                  "&:hover fieldset": {
                    borderColor: "#cbd5e1",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                    borderWidth: "2px",
                  },
                },
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">In Hand</label>
            <TextField
              fullWidth
              name="inHandSalary"
              value={formData.inHandSalary}
              onChange={handleChange}
              size="small"
              type="number"
              placeholder="Enter in-hand salary"
              inputProps={{ min: 0, step: "0.01" }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "& fieldset": {
                    borderColor: "#eaeaea",
                  },
                  "&:hover fieldset": {
                    borderColor: "#cbd5e1",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                    borderWidth: "2px",
                  },
                },
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Transport Allowance</label>
            <TextField
              fullWidth
              name="transportAllowance"
              value={formData.transportAllowance}
              onChange={handleChange}
              size="small"
              type="number"
              placeholder="Enter transport allowance"
              inputProps={{ min: 0, step: "0.01" }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "& fieldset": {
                    borderColor: "#eaeaea",
                  },
                  "&:hover fieldset": {
                    borderColor: "#cbd5e1",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                    borderWidth: "2px",
                  },
                },
              }}
            />
          </div>
        </>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">Candidate Type</label>
        <TextField
          select
          fullWidth
          name="employmentType"
          value={formData.employmentType}
          onChange={handleChange}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": {
                borderColor: "#eaeaea",
              },
              "&:hover fieldset": {
                borderColor: "#cbd5e1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
                borderWidth: "2px",
              },
            },
          }}
        >
          <MenuItem value="fresher">Fresher</MenuItem>
          <MenuItem value="experienced">Experienced</MenuItem>
        </TextField>
      </div>
    </div>
    {/* Checkboxes in Row Layout */}
    <div className="flex flex-wrap items-center gap-6 mt-5">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="isCoreTeam"
          checked={formData.isCoreTeam}
          onChange={handleChange}
          className="w-4 h-4 rounded   text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-slate-700"> Core Team Member</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="isTeamLeader"
          checked={formData.isTeamLeader}
          onChange={handleChange}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-slate-700"> Team Leader Eligible</span>
      </label>
    </div>
  </div>
)}

      {/* Documents Section */}
      {activeSection === "documents" && (
        <div className="p-6">
          <div className="mb-6 rounded-xl border p-4" style={{ borderColor: "#eaeaea", backgroundColor: "#f0f9ff" }}>
            {isSuperAdmin && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3" style={{ borderColor: "#e2e8f0" }}>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {selectedUser?.accountType === "HR" ? "Global HR Window" : "HR Re-upload Window"}
                  </span>
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      (selectedUser?.accountType === "HR" ? isHrGlobalOverrideActive : isHrOverrideActive)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {(selectedUser?.accountType === "HR" ? isHrGlobalOverrideActive : isHrOverrideActive)
                      ? formatRemaining(
                          selectedUser?.accountType === "HR"
                            ? selectedUser?.hrGlobalDocumentOverrideUntil
                            : selectedUser?.hrDocumentOverrideUntil
                        )
                      : "00:00"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="contained"
                    size="small"
                    disabled={grantingOverride}
                    onClick={() => handleSetHrOverride(true)}
                    sx={{ textTransform: "none", borderRadius: "10px" }}
                  >
                    Allow 30m
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={grantingOverride}
                    onClick={() => handleSetHrOverride(false)}
                    sx={{ textTransform: "none", borderRadius: "10px", borderColor: "#e2e8f0" }}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            )}

            <p className="text-sm font-semibold text-cyan-900">Policy Documents (Consent Required)</p>
            <p className="mt-1 text-xs text-cyan-700">
              Static company policies for every employee. Employee signs from dashboard, HR can co-sign from here.
            </p>

            <div className="mt-3 space-y-2">
              {policyDocuments.length === 0 && (
                <p className="text-xs text-slate-500">No policy documents assigned.</p>
              )}
              {policyDocuments.map((doc, idx) => {
                const employeeSigned = Boolean(doc?.signatureStatus?.employee?.signed);
                const hrSigned = Boolean(doc?.signatureStatus?.hr?.signed);
                const employeeSignUrl = doc?.signatureStatus?.employee?.signatureUrl || "";
                const hrSignUrl = doc?.signatureStatus?.hr?.signatureUrl || "";
                const signedPdfUrl = doc?.signatureStatus?.signedPdfUrl || "";
                const policyPreviewUrl = signedPdfUrl || doc.url;
                return (
                  <div
                    key={`${doc.url}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2"
                    style={{ borderColor: "#eaeaea" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          name: doc.name || `Policy ${idx + 1}`,
                          url: policyPreviewUrl,
                        })
                      }
                      className="max-w-[50%] truncate text-left text-sm font-medium text-cyan-700 hover:underline"
                    >
                      {doc.name || `Policy ${idx + 1}`}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${employeeSigned ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        Employee {employeeSigned ? "Signed" : "Pending"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${hrSigned ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        HR {hrSigned ? "Signed" : "Pending"}
                      </span>
                      {employeeSigned && hrSigned && signedPdfUrl && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          Signed PDF Ready
                        </span>
                      )}
                      {employeeSignUrl && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setPreviewDoc({ name: `Employee Signature - ${doc.name}`, url: employeeSignUrl })}
                          sx={{ textTransform: "none", minWidth: "auto", fontSize: "0.7rem" }}
                        >
                          See Emp Sign
                        </Button>
                      )}
                      {hrSignUrl && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setPreviewDoc({ name: `HR Signature - ${doc.name}`, url: hrSignUrl })}
                          sx={{ textTransform: "none", minWidth: "auto", fontSize: "0.7rem" }}
                        >
                          See HR Sign
                        </Button>
                      )}
                      {(employeeSigned || hrSigned) && policyPreviewUrl && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setPreviewDoc({ name: `Signed Policy - ${doc.name}`, url: policyPreviewUrl })}
                          sx={{ textTransform: "none", minWidth: "auto", fontSize: "0.7rem" }}
                        >
                          See Signed PDF
                        </Button>
                      )}
                      {policyPreviewUrl && (
                        <Button
                          component="a"
                          href={policyPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          variant="text"
                          size="small"
                          sx={{ textTransform: "none", minWidth: "auto", fontSize: "0.7rem" }}
                        >
                          Download PDF
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setHrSignModal({ open: true, doc, party: "employee" });
                          setHrSignatureDataUrl("");
                          setHrSignatureHasStroke(false);
                        }}
                        sx={{ 
                          textTransform: "none", 
                          borderRadius: "10px", 
                          minWidth: "104px",
                          borderColor: "#eaeaea",
                          "&:hover": { borderColor: "#cbd5e1" }
                        }}
                      >
                        {employeeSigned ? "Edit Emp Sign" : "Emp Sign"}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setHrSignModal({ open: true, doc, party: "hr" });
                          setHrSignatureDataUrl("");
                          setHrSignatureHasStroke(false);
                        }}
                        sx={{ 
                          textTransform: "none", 
                          borderRadius: "10px", 
                          minWidth: "88px",
                          borderColor: "#eaeaea",
                          "&:hover": { borderColor: "#cbd5e1" }
                        }}
                      >
                        {hrSigned ? "Edit HR Sign" : "HR Sign"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: "#eff6ff", border: "1px solid #eaeaea" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Document Upload Status</span>
              <span className="text-xs text-blue-700">
                {Object.values(documents).filter((doc) => doc !== null && (!isFresher || !isPreviousEmploymentDoc(doc?.name || ""))).length} / {totalVisibleDocs} Uploaded
              </span>
            </div>
            <LinearProgress 
              variant="determinate" 
              value={
                totalVisibleDocs > 0
                  ? (Object.values(documents).filter((doc) => doc !== null && (!isFresher || !isPreviousEmploymentDoc(doc?.name || ""))).length / totalVisibleDocs) * 100
                  : 0
              }
              sx={{ height: 6, borderRadius: 3, backgroundColor: "#bfdbfe", "& .MuiLinearProgress-bar": { backgroundColor: "#3b82f6" } }}
            />
          </div>

          {isFresher && (
            <div className="mb-6 rounded-xl border p-3" style={{ borderColor: "#eaeaea", backgroundColor: "#f8fafc" }}>
              <p className="text-xs font-medium text-slate-700">
                Previous Employment documents are disabled for fresher candidates.
              </p>
            </div>
          )}

          {/* Document Categories */}
          {visibleDocCategories.map(([category, docs]) => (
            <div key={category} className="mb-8">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FolderOpen sx={{ fontSize: 18, color: "#3b82f6" }} />
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {docs.map((doc) => {
                  const uploadedDoc = documents[doc.id];
                  const isUploading = uploadStates[doc.id];
                  const requiredForEmployee = getDocRequired(doc);
                  const lockedForHr = isDocLockedForHr(uploadedDoc);
                  
                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border transition-all ${
                        uploadedDoc
                          ? "border-green-200 bg-green-50/30"
                          : requiredForEmployee
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-slate-200 bg-white"
                      }`}
                      style={{ borderColor: uploadedDoc ? "#86efac" : requiredForEmployee ? "#fed7aa" : "#eaeaea" }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            uploadedDoc
                              ? "bg-green-100"
                              : requiredForEmployee
                              ? "bg-amber-100"
                              : "bg-slate-100"
                          }`}>
                            {doc.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                              {requiredForEmployee && (
                                <span className="text-xs text-red-500">*</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {getDocumentStatusText(uploadedDoc, requiredForEmployee)}
                            </p>
                            {uploadedDoc && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-500 truncate">
                                  {uploadedDoc.fileName}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  IP: {uploadedDoc.uploadedIp || "N/A"}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Uploaded: {uploadedDoc.uploadedAt ? new Date(uploadedDoc.uploadedAt).toLocaleString() : "N/A"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {uploadedDoc && (
                            <>
                              <Tooltip title="Preview">
                                <IconButton
                                  size="small"
                                  onClick={() => setPreviewDoc(uploadedDoc)}
                                  sx={{ color: "#3b82f6" }}
                                >
                                  <RemoveRedEye sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove">
                                <IconButton
                                  size="small"
                                  onClick={() => removeDocument(doc.id)}
                                  disabled={lockedForHr}
                                  sx={{ color: "#ef4444" }}
                                >
                                  <Delete sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Button
                            variant={uploadedDoc ? "outlined" : "contained"}
                            size="small"
                            onClick={() => handleFileSelect(doc.id)}
                            disabled={isUploading || lockedForHr}
                            startIcon={isUploading ? <CircularProgress size={16} /> : <Upload />}
                            sx={{
                              textTransform: "none",
                              borderRadius: "10px",
                              fontSize: "0.75rem",
                              borderColor: "#eaeaea",
                              ...(uploadedDoc && {
                                borderColor: "#cbd5e1",
                                color: "#475569",
                                "&:hover": { borderColor: "#94a3b8" }
                              })
                            }}
                          >
                            {isUploading ? "Uploading..." : lockedForHr ? "Locked" : uploadedDoc ? "Replace" : "Upload"}
                          </Button>
                          <input
                            id={`file-input-${doc.id}`}
                            type="file"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                uploadDocument(doc.id, e.target.files[0]);
                                e.target.value = "";
                              }
                            }}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Section */}
      {activeSection === "security" && (
        <div className="p-6">
          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: "#fffbeb", border: "1px solid #eaeaea" }}>
            <div className="flex items-start gap-2">
              <Security sx={{ fontSize: 18, color: "#f59e0b" }} />
              <div>
                <p className="text-sm font-medium text-amber-800">Password Change</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Leave fields blank to keep current password unchanged
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password</label>
              <TextField
                fullWidth
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#eaeaea",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: "2px",
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end" size="small">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm Password</label>
              <TextField
                fullWidth
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#eaeaea",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: "2px",
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleConfirmPasswordVisibility} edge="end" size="small">
                        {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <Alert severity="error" sx={{ borderRadius: "12px" }}>
                Passwords do not match
              </Alert>
            )}
            {formData.password && formData.password.length < 6 && (
              <Alert severity="warning" sx={{ borderRadius: "12px" }}>
                Password must be at least 6 characters long
              </Alert>
            )}
          </div>
        </div>
      )}
      </fieldset>
    </DialogContent>

    <DialogActions sx={{ p: 3, borderTop: "1px solid #eaeaea", gap: 2 }}>
      <Button
        onClick={handleCloseDialog}
        variant="outlined"
        sx={{
          textTransform: "none",
          borderRadius: "12px",
          px: 3,
          color: "#64748b",
          borderColor: "#eaeaea",
          "&:hover": { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" }
        }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={(isSelectedUserInactive && !isSuperAdmin) || isSaving || (formData.password && (formData.password !== formData.confirmPassword || formData.password.length < 6))}
        startIcon={isSaving ? <CircularProgress size={18} /> : <Save />}
        sx={{
          textTransform: "none",
          borderRadius: "12px",
          px: 4,
          backgroundColor: "#3b82f6",
          "&:hover": { backgroundColor: "#2563eb" }
        }}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </DialogActions>
  </Dialog>

  <Dialog
    open={cameraOpen}
    onClose={closeCamera}
    fullWidth
    maxWidth="md"
    PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}
  >
    <DialogTitle sx={{ borderBottom: "1px solid #eaeaea", py: 2 }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">Capture Employee Photo</p>
          <p className="text-xs text-slate-500">Use local PC camera and upload to Cloudinary</p>
        </div>
        <IconButton onClick={closeCamera} size="small">
          <Close />
        </IconButton>
      </div>
    </DialogTitle>
    <DialogContent sx={{ p: 2, backgroundColor: "#f8fafc" }}>
      <div className="rounded-xl border bg-black" style={{ borderColor: "#e2e8f0" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", maxHeight: "58vh", objectFit: "cover", borderRadius: "12px" }}
        />
      </div>
      {cameraLoading && (
        <p className="mt-2 text-xs text-slate-500">Initializing camera...</p>
      )}
    </DialogContent>
    <DialogActions sx={{ p: 2, borderTop: "1px solid #eaeaea" }}>
      <Button onClick={closeCamera}>Cancel</Button>
      <Button
        variant="contained"
        onClick={captureProfilePhoto}
        disabled={cameraLoading || uploadingProfilePhoto}
        startIcon={uploadingProfilePhoto ? <CircularProgress size={16} /> : <CameraAlt />}
      >
        {uploadingProfilePhoto ? "Uploading..." : "Capture & Upload"}
      </Button>
    </DialogActions>
  </Dialog>

  {/* Document Preview Dialog */}
  <Dialog
    open={Boolean(previewDoc)}
    onClose={() => setPreviewDoc(null)}
    fullWidth
    maxWidth="md"
    PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}
  >
    <DialogTitle sx={{ borderBottom: "1px solid #eaeaea", py: 2 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Description sx={{ color: "#3b82f6" }} />
          <span className="font-medium">{previewDoc?.name || "Document Preview"}</span>
        </div>
        <IconButton onClick={() => setPreviewDoc(null)} size="small">
          <Close />
        </IconButton>
      </div>
    </DialogTitle>
    <DialogContent sx={{ p: 0, backgroundColor: "#fafcff" }}>
      {previewDoc?.url ? (
        <iframe
          src={previewDoc.url}
          title={previewDoc.name || "Document"}
          style={{ width: "100%", height: "70vh", border: "none" }}
        />
      ) : (
        <div className="flex h-96 items-center justify-center">
          <p className="text-slate-400">No preview available</p>
        </div>
      )}
    </DialogContent>
    <DialogActions sx={{ p: 2, borderTop: "1px solid #eaeaea" }}>
      <Button onClick={() => setPreviewDoc(null)}>Close</Button>
      {previewDoc?.url && (
        <Button
          component="a"
          href={previewDoc.url}
          target="_blank"
          variant="contained"
          startIcon={<Download />}
        >
          Download
        </Button>
      )}
    </DialogActions>
  </Dialog>

  <Dialog
    open={hrSignModal.open}
    onClose={() => setHrSignModal({ open: false, doc: null, party: "hr" })}
    fullWidth
    maxWidth="md"
    PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}
  >
    <DialogTitle sx={{ borderBottom: "1px solid #eaeaea", py: 2 }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">
            {hrSignModal.party === "employee" ? "Employee Signature Capture" : "HR Policy Signature"}
          </p>
          <p className="text-xs text-slate-500">{hrSignModal.doc?.name || "Policy Document"}</p>
        </div>
        <IconButton onClick={() => setHrSignModal({ open: false, doc: null, party: "hr" })} size="small">
          <Close />
        </IconButton>
      </div>
    </DialogTitle>
    <DialogContent sx={{ p: 2, backgroundColor: "#fafcff" }}>
      {hrSignModal.doc?.url && (
        <iframe
          src={hrSignModal.doc.url}
          title="Policy"
          style={{ width: "100%", height: "45vh", border: "1px solid #eaeaea", borderRadius: 12, background: "#fff" }}
        />
      )}
      <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "#eaeaea", backgroundColor: "#fff" }}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">HR Signature</p>
        <SignaturePadCanvas
          onChange={(dataUrl, hasStroke) => {
            setHrSignatureDataUrl(dataUrl);
            setHrSignatureHasStroke(hasStroke);
          }}
          disabled={savingHrSignature}
        />
      </div>
    </DialogContent>
    <DialogActions sx={{ p: 2, borderTop: "1px solid #eaeaea" }}>
      <Button onClick={() => setHrSignModal({ open: false, doc: null, party: "hr" })}>Cancel</Button>
      <Button
        onClick={submitHrSignature}
        variant="contained"
        disabled={savingHrSignature || !hrSignatureHasStroke}
      >
        {savingHrSignature
          ? "Saving..."
          : hrSignModal.party === "employee"
          ? "Save Employee Sign"
          : "Sign as HR"}
      </Button>
    </DialogActions>
  </Dialog>

  <DialogBox open={openDialogBox} onClose={() => setOpenDialogBox(false)} />
  <ConfirmActionModal
    open={Boolean(deleteTarget)}
    title="Delete Employee"
    description={`Delete ${deleteTarget?.realName || deleteTarget?.username || "this employee"}? This action cannot be undone.`}
    confirmText="Delete"
    cancelText="Cancel"
    danger
    loading={deletingEmployee}
    onClose={() => {
      if (!deletingEmployee) setDeleteTarget(null);
    }}
    onConfirm={confirmDeleteEmployee}
  />
</div>
  );
};

export default ManageEmployee;
