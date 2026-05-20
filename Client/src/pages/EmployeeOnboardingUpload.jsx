import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// const API_URL = "http://localhost:4000/api/v1";
const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

const EmployeeOnboardingUpload = () => {
  const queryToken = useMemo(
    () => new URLSearchParams(window.location.search).get("token") || "",
    []
  );
  const [token] = useState(queryToken);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [uploadedMap, setUploadedMap] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState("");

  useEffect(() => {
    const init = async () => {
      if (!token) {
        toast.error("Invalid onboarding link");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/employee/onboarding/verify`, {
          params: { token },
        });
        setEmployee(res.data?.employee || null);
        setRequiredDocs(Array.isArray(res.data?.requiredDocs) ? res.data.requiredDocs : []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Invalid or expired link");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const handleUpload = async (docName, file) => {
    if (!file) return;
    setUploadingDoc(docName);
    try {
      const form = new FormData();
      form.append("token", token);
      form.append("documentName", docName);
      form.append("file", file);
      const res = await axios.post(`${API_URL}/employee/onboarding/upload-asset`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedMap((prev) => ({ ...prev, [docName]: res.data?.asset }));
      toast.success(`${docName} uploaded`);
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to upload ${docName}`);
    } finally {
      setUploadingDoc("");
    }
  };

  const allDone = requiredDocs.length > 0 && requiredDocs.every((d) => uploadedMap[d]);

  const handleSubmit = async () => {
    if (!allDone) {
      toast.error("Please upload all required documents");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/employee/onboarding/submit`, {
        token,
        documents: requiredDocs.map((docName) => uploadedMap[docName]).filter(Boolean),
      });
      toast.success("Documents submitted successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit documents");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading...</div>;
  }

  if (!employee) {
    return <div className="min-h-screen flex items-center justify-center text-rose-600">Invalid or expired onboarding link.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Document Upload</h1>
        <p className="mt-1 text-sm text-slate-600">
          Hello {employee.realName}, please upload all mandatory documents.
        </p>
        <p className="mt-1 text-xs text-slate-500">File size policy: Images up to 200KB, PDFs up to 300KB.</p>

        <div className="mt-6 space-y-3">
          {requiredDocs.map((docName) => (
            <div key={docName} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{docName}</p>
                  <p className="text-xs text-slate-500">
                    {uploadedMap[docName] ? "Uploaded" : "Pending"}
                  </p>
                </div>
                <label className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  {uploadingDoc === docName ? "Uploading..." : uploadedMap[docName] ? "Replace" : "Upload"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleUpload(docName, e.target.files?.[0])}
                    disabled={uploadingDoc === docName || submitting}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allDone || submitting}
          className={`mt-6 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
            !allDone || submitting ? "bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {submitting ? "Submitting..." : "Submit All Documents"}
        </button>
      </div>
    </div>
  );
};

export default EmployeeOnboardingUpload;

