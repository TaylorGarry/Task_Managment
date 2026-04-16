import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { signupUser, fetchReportingManagers, uploadEmployeeAsset } from "../features/slices/authSlice.js";
import AdminNavbar from "../components/AdminNavbar.jsx";
import EmployeeCreateConfirmModal from "../components/EmployeeCreateConfirmModal.jsx";
import StyledDatePicker from "../components/StyledDatePicker.jsx";
import { DESIGNATION_OPTIONS } from "../constants/designationOptions.js";
import { Toaster } from "react-hot-toast";
import {
  DEPARTMENT_OPTIONS,
  canManageAdminPanels,
  normalizeDepartment,
} from "../utils/roleAccess.js";

const shiftOptions = [
  { label: "1 AM - 10 AM", shiftLabel: "1am-10am" },
  { label: "4 PM - 1 AM", shiftLabel: "4pm-1am" },
  { label: "5 PM - 2 AM", shiftLabel: "5pm-2am" },
  { label: "6 PM - 3 AM", shiftLabel: "6pm-3am" },
  { label: "8 PM - 5 AM", shiftLabel: "8pm-5am" },
  { label: "11 PM - 8 AM", shiftLabel: "11pm-8am" },
];

const departmentOptions = DEPARTMENT_OPTIONS;

const STATIC_POLICY_DOCS = [
  "/policies/Leave Policy.pdf",
  "/policies/IT Usage Policy.pdf",
  "/policies/Exit Policy 1.1.pdf",
  "/policies/Data Security Agreement.pdf",
  "/policies/Code of Conduct.pdf",
];

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, reportingManagers = [] } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDocFiles, setSelectedDocFiles] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmSummary, setConfirmSummary] = useState({});
  const [pendingPayload, setPendingPayload] = useState(null);

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm({
    defaultValues: {
      accountType: "agent",
      department: "Operations",
      isCoreTeam: false,
      isTeamLeader: false,
      transportOffice: "No",
      docsStatus: "No",
      shiftLabel: "1am-10am",
    },
  });

  const accountType = watch("accountType");
  const department = watch("department");
  const isCoreTeam = watch("isCoreTeam");
  const isTeamLeader = watch("isTeamLeader");
  const username = watch("username");
  const password = watch("password");
  const realName = watch("realName");
  const pseudoName = watch("pseudoName");
  const empId = watch("empId");
  const dateOfJoining = watch("dateOfJoining");
  const designation = watch("designation");
  const shiftLabel = watch("shiftLabel");
  const docsStatus = watch("docsStatus");
  const isEmployee = accountType === "agent" || accountType === "supervisor";
  const totalSteps = isEmployee ? 3 : 1;

  useEffect(() => {
    if (!isEmployee) {
      setCurrentStep(1);
    }
  }, [isEmployee]);

  useEffect(() => {
    const allowed = canManageAdminPanels(user);

    if (!user || !allowed) {
      navigate(user ? "/dashboard" : "/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isEmployee && department) {
      dispatch(fetchReportingManagers(department));
    }
  }, [dispatch, isEmployee, department]);

  const managerOptions = useMemo(() => {
    return reportingManagers.map((m) => ({
      id: m._id,
      label: m.realName ? `${m.realName} (${m.username})` : m.username,
    }));
  }, [reportingManagers]);

  const addMultipleDocuments = async () => {
    if (!selectedDocFiles.length) {
      toast.error("Select one or more files first");
      return;
    }
    const existingNames = new Set(documents.map((doc) => String(doc.name || "").toLowerCase()));
    const duplicate = selectedDocFiles.find((file) => existingNames.has(String(file.name || "").toLowerCase()));
    if (duplicate) {
      toast.error(`"${duplicate.name}" already added`);
      return;
    }

    setUploadingDocs(true);
    try {
      const uploadedDocs = [];
      for (const file of selectedDocFiles) {
        const asset = await dispatch(uploadEmployeeAsset({ file, assetType: "document" })).unwrap();
        uploadedDocs.push({
          name: file.name,
          url: asset.url,
          uploaded: true,
          publicId: asset.publicId || "",
          fileName: asset.originalName || file.name || "",
          mimeType: asset.mimeType || file.type || "",
          size: asset.bytes || file.size || 0,
        });
      }
      setDocuments((prev) => [...prev, ...uploadedDocs]);
      setSelectedDocFiles([]);
      toast.success(`${uploadedDocs.length} document(s) uploaded`);
    } catch (err) {
      toast.error(err || "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
    }
  };

  const removeDocument = (name) => {
    setDocuments((prev) => prev.filter((doc) => doc.name !== name));
  };

  const goNextStep = () => setCurrentStep((prev) => Math.min(totalSteps, prev + 1));

  const hasText = (value) => String(value || "").trim().length > 0;
  const isStep1Complete = hasText(username) && hasText(password) && hasText(accountType) && hasText(department);
  const isStep2Complete =
    !isEmployee ||
    (hasText(realName) &&
      hasText(pseudoName) &&
      hasText(empId) &&
      hasText(dateOfJoining) &&
      hasText(designation) &&
      (isCoreTeam || hasText(shiftLabel)));
  const isStep3Complete = !isEmployee || (docsStatus === "No" ? true : documents.length > 0);

  const stepItems = isEmployee
    ? [
        { id: 1, label: "Account", complete: isStep1Complete },
        { id: 2, label: "Profile", complete: isStep2Complete },
        { id: 3, label: "Compliance", complete: isStep3Complete },
      ]
    : [{ id: 1, label: "Account", complete: isStep1Complete }];

  const buildPayload = (data) => {
    const payload = {
      username: data.username,
      password: data.password,
      accountType: data.accountType,
      department: normalizeDepartment(data.department),
      isCoreTeam: Boolean(data.isCoreTeam),
    };

    if (isEmployee) {
      payload.realName = data.realName;
      payload.pseudoName = data.pseudoName;
      payload.isTeamLeader = data.accountType === "supervisor" ? true : Boolean(data.isTeamLeader);
      payload.empId = data.empId;
      payload.dateOfJoining = data.dateOfJoining;
      payload.transportOffice = data.transportOffice;
      payload.docsStatus = data.docsStatus;
      payload.documents = documents;
      payload.designation = data.designation;
      if (hasText(data.reportingManager)) {
        payload.reportingManager = data.reportingManager;
      }
      payload.policyDocuments = STATIC_POLICY_DOCS;
    }

    if (isEmployee && !data.isCoreTeam) {
      payload.shiftLabel = data.shiftLabel;
    }
    return payload;
  };

  const buildSummary = (data) => {
    const reportingManagerLabel =
      managerOptions.find((m) => m.id === data.reportingManager)?.label || data.reportingManager || "-";
    return {
      username: data.username,
      accountType: data.accountType,
      department: normalizeDepartment(data.department),
      realName: data.realName,
      pseudoName: data.pseudoName,
      empId: data.empId,
      dateOfJoining: data.dateOfJoining,
      designation: data.designation,
      reportingManagerLabel,
      transportOffice: data.transportOffice,
      docsStatus: data.docsStatus,
      shiftLabel: data.shiftLabel,
      isCoreTeam: Boolean(data.isCoreTeam),
      isTeamLeader: Boolean(data.isTeamLeader),
      documentsCount: documents.length,
      documentNames: documents.map((d) => d.name),
      policyDocumentsCount: STATIC_POLICY_DOCS.length,
      policyDocumentNames: STATIC_POLICY_DOCS.map((doc) => doc.split("/").pop() || doc),
    };
  };

  const onSubmit = async (data) => {
    const values = { ...getValues(), ...data };
    if (isEmployee) {
      const missingSteps = [];
      if (!isStep1Complete) missingSteps.push(1);
      if (!isStep2Complete) missingSteps.push(2);
      if (!isStep3Complete) missingSteps.push(3);
      if (missingSteps.length) {
        setCurrentStep(missingSteps[0]);
        toast.error(`Complete all required fields before submit. Pending step(s): ${missingSteps.join(", ")}`);
        return;
      }
    }

    if (creatingUser) return;
    const payload = buildPayload(values);
    const summary = buildSummary(values);
    setPendingPayload(payload);
    setConfirmSummary(summary);
    setShowConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    if (!pendingPayload || creatingUser) return;
    setCreatingUser(true);
    try {
      const resultAction = await dispatch(signupUser(pendingPayload));
      const success = signupUser.fulfilled.match(resultAction);
      if (success) {
        toast.success(isEmployee ? "Employee added successfully" : "User created successfully");
        setDocuments([]);
        setSelectedDocFiles([]);
        setCurrentStep(1);
        setShowConfirmModal(false);
        setPendingPayload(null);
        setConfirmSummary({});
        reset({
          accountType: "agent",
          department: "Operations",
          isCoreTeam: false,
          isTeamLeader: false,
          transportOffice: "No",
          docsStatus: "No",
          shiftLabel: "1am-10am",
        });
      } else {
        toast.error(resultAction.payload || "Creation failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <>
      <Toaster />
      <AdminNavbar />
      <div className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-slate-100 via-cyan-50 to-white pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(55%_55%_at_15%_10%,rgba(2,132,199,0.12),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_45%_at_90%_10%,rgba(14,116,144,0.14),rgba(255,255,255,0))]" />
        <div className="relative mx-auto max-w-[1600px] px-3 md:px-4 py-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_65px_-45px_rgba(15,23,42,0.45)]">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.35fr]">
              <section className="border-b border-slate-200 bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 p-8 text-white lg:border-b-0 lg:border-r">
                <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
                  HR Workspace
                </p>
                <h1 className="mt-5 text-3xl font-semibold leading-tight">Employee Onboarding Desk</h1>
                <p className="mt-3 text-sm text-cyan-100/90">
                  Create complete employee profiles with reporting structure, documents, shift allocation, and policy setup.
                </p>
                <div className="mt-8 grid gap-3">
                  <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100">Data Quality</p>
                    <p className="mt-1 text-sm text-white/90">Required profile fields help keep roster and attendance mapping clean.</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100">Compliance</p>
                    <p className="mt-1 text-sm text-white/90">Policy docs and acceptance are linked to each employee account.</p>
                  </div>
                </div>
              </section>

              <section className="bg-white p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">{isEmployee ? "Add Employee" : "Create User"}</h2>
                  <p className="mt-1 text-sm text-slate-500">Complete the form and submit to create account access.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 text-sm font-medium text-slate-700">Step {currentStep} of {totalSteps}</div>
                    <div className="flex items-center gap-2">
                      {stepItems.map((step, idx) => (
                        <React.Fragment key={step.id}>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(step.id)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                              currentStep === step.id
                                ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                                step.complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {step.complete ? "✓" : step.id}
                            </span>
                            <span>{step.label}</span>
                            <span className={`text-[10px] ${step.complete ? "text-emerald-700" : "text-slate-500"}`}>
                              {step.complete ? "Completed" : "Pending"}
                            </span>
                          </button>
                          {idx < stepItems.length - 1 && (
                            <div className={`h-0.5 flex-1 ${step.complete ? "bg-emerald-500" : "bg-slate-300"}`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {currentStep === 1 && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Username</label>
                          <input
                            type="text"
                            placeholder="e.g. jdoe"
                            {...register("username", { required: true })}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Password</label>
                          <div className="relative mt-2">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Temporary password"
                              {...register("password", { required: true })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                              disabled={creatingUser}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Account Type</label>
                          <select
                            {...register("accountType")}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          >
                            <option value="agent">Agent</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="superAdmin">Super Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Department</label>
                          <select
                            {...register("department", { required: true })}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          >
                            {departmentOptions.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {isEmployee ? (
                        <button
                          type="button"
                          onClick={goNextStep}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-cyan-700"
                          disabled={creatingUser}
                        >
                          Next Step
                          <ChevronRight size={18} />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={creatingUser}
                          className={`w-full rounded-xl px-4 py-3 text-base font-semibold text-white transition ${
                            creatingUser ? "cursor-not-allowed bg-cyan-300" : "bg-cyan-600 hover:bg-cyan-700"
                          }`}
                        >
                          {creatingUser ? "Saving..." : "Create User"}
                        </button>
                      )}
                    </>
                  )}

                  {currentStep === 2 && isEmployee && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Real Name</label>
                          <input
                            type="text"
                            {...register("realName", { required: true })}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Pseudo Name</label>
                          <input
                            type="text"
                            {...register("pseudoName", { required: true })}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Employee ID</label>
                          <input
                            type="text"
                            {...register("empId", { required: true })}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Date of Joining</label>
                          <div className="mt-2">
                            <input type="hidden" {...register("dateOfJoining", { required: true })} />
                            <StyledDatePicker
                              value={watch("dateOfJoining")}
                              onChange={(val) => setValue("dateOfJoining", val, { shouldValidate: true })}
                              disabled={creatingUser}
                              placeholder="Select joining date"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Designation</label>
                          <select
                            {...register("designation", { required: true })}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          >
                            <option value="">Select designation</option>
                            {DESIGNATION_OPTIONS.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Reporting Manager</label>
                          <select
                            {...register("reportingManager")}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          >
                            <option value="">Select manager</option>
                            {managerOptions.map((manager) => (
                              <option key={manager.id} value={manager.id}>
                                {manager.label}
                              </option>
                            ))}
                          </select>
                          {managerOptions.length === 0 && (
                            <p className="mt-1 text-xs text-amber-700">
                              No managers found in this department. Mark a user as Team Leader Eligible (Supervisor) for this department.
                            </p>
                          )}
                        </div>
                        {!isCoreTeam && (
                          <div>
                            <label className="text-sm font-medium text-slate-700">Shift</label>
                            <select
                              {...register("shiftLabel", { required: true })}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                              disabled={creatingUser}
                            >
                              {shiftOptions.map((option) => (
                                <option key={option.shiftLabel} value={option.shiftLabel}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Transport Office</label>
                          <select
                            {...register("transportOffice")}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Docs Status</label>
                          <select
                            {...register("docsStatus")}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            disabled={creatingUser}
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                        disabled={creatingUser}
                      >
                        <ChevronLeft size={18} />
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={goNextStep}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-cyan-700"
                        disabled={creatingUser}
                      >
                        Next Step
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    </>
                  )}

                  {currentStep === 3 && isEmployee && (
                    <>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className="text-sm font-medium text-slate-700">Upload Employee Documents</label>
                        <div className="mt-3 flex gap-2">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => setSelectedDocFiles(Array.from(e.target.files || []))}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs"
                            disabled={creatingUser || uploadingDocs}
                          />
                          <button
                            type="button"
                            onClick={addMultipleDocuments}
                            className="inline-flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-60"
                            disabled={creatingUser || uploadingDocs || selectedDocFiles.length === 0}
                          >
                            <Plus size={16} />
                            {uploadingDocs ? "Uploading..." : "Upload Files"}
                          </button>
                        </div>
                        {selectedDocFiles.length > 0 && (
                          <p className="mt-2 text-xs text-slate-500">
                            Selected: {selectedDocFiles.length} file(s)
                          </p>
                        )}
                        {documents.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {documents.map((doc) => (
                              <span
                                key={doc.name}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                              >
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="text-cyan-700 hover:underline"
                                >
                                  {doc.name}
                                </button>
                                <button type="button" onClick={() => removeDocument(doc.name)} className="text-rose-500">
                                  <Trash2 size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Policy Documents (Static for All Employees)</label>
                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs text-slate-600">
                            These policy files are common for every employee. No need to upload per employee.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {STATIC_POLICY_DOCS.map((doc) => (
                              <span
                                key={doc}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                              >
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc({ name: doc.split("/").pop() || doc, url: doc })}
                                  className="text-cyan-700 hover:underline"
                                >
                                  {doc.split("/").pop() || doc}
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <label className="text-sm font-medium text-slate-700">Core Team Member</label>
                        <button
                          type="button"
                          onClick={() => setValue("isCoreTeam", !isCoreTeam)}
                          className={`relative h-6 w-11 rounded-full transition ${isCoreTeam ? "bg-cyan-600" : "bg-slate-300"}`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                              isCoreTeam ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <label className="text-sm font-medium text-slate-700">Team Leader Eligible</label>
                        <button
                          type="button"
                          onClick={() => setValue("isTeamLeader", !isTeamLeader)}
                          className={`relative h-6 w-11 rounded-full transition ${isTeamLeader ? "bg-cyan-600" : "bg-slate-300"}`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                              isTeamLeader ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                        disabled={creatingUser}
                      >
                        <ChevronLeft size={18} />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={creatingUser}
                        className={`w-full rounded-xl px-4 py-3 text-base font-semibold text-white transition ${
                          creatingUser ? "cursor-not-allowed bg-cyan-300" : "bg-cyan-600 hover:bg-cyan-700"
                        }`}
                      >
                        {creatingUser ? "Saving..." : isEmployee ? "Add Employee" : "Create User"}
                      </button>
                      </div>
                    </>
                  )}
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
      {previewDoc && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-base font-semibold text-slate-900">{previewDoc.name}</h3>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-4">
              {previewDoc.url ? (
                <>
                  <iframe src={previewDoc.url} title={previewDoc.name} className="h-[55vh] w-full rounded-lg border border-slate-200" />
                  <div className="mt-3 flex justify-end">
                    <a
                      href={previewDoc.url}
                      download={previewDoc.fileName || previewDoc.name}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                    >
                      Download
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">No file URL available for this document.</p>
              )}
            </div>
          </div>
        </div>
      )}
      <EmployeeCreateConfirmModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmCreate}
        loading={creatingUser}
        summary={confirmSummary}
      />
    </>
  );
};

export default Signup;
