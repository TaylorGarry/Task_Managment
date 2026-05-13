import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { fetchEmployeeDashboardSummary } from "../features/slices/authSlice";
import Navbar from "./Navbar";

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

const getPolicyName = (url = "") => {
  const clean = normalizePolicyKey(url);
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean || "Policy";
};

const formatDate = (dateVal) => {
  if (!dateVal) return "-";
  return new Date(dateVal).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MyProfile = () => {
  const dispatch = useDispatch();
  const { employeeDashboardSummary } = useSelector((state) => state.auth);
  const user = JSON.parse(localStorage.getItem("user"));
  const profile = employeeDashboardSummary?.profile;

  const [policyPreviewText, setPolicyPreviewText] = useState("");
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [activePolicyUrl, setActivePolicyUrl] = useState("");
  const [activePolicyPreviewUrl, setActivePolicyPreviewUrl] = useState("");
  const [activePolicyText, setActivePolicyText] = useState("");
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyLoadError, setPolicyLoadError] = useState("");

  useEffect(() => {
    if (user?.accountType === "employee") {
      dispatch(fetchEmployeeDashboardSummary());
    }
  }, [dispatch, user?.accountType]);

  useEffect(() => {
    const loadPolicyText = async () => {
      try {
        const res = await fetch("/policy-sample.txt");
        const text = await res.text();
        setPolicyPreviewText(text);
      } catch (err) {
        setPolicyPreviewText("Unable to load policy text preview.");
      }
    };
    loadPolicyText();
  }, []);

  const getPolicySignatureStatus = (docUrl, profileData) => {
    const signatures = Array.isArray(profileData?.policySignatures) ? profileData.policySignatures : [];
    const target = normalizePolicyKey(docUrl);
    return signatures.find((item) => normalizePolicyKey(item?.documentUrl || "") === target) || null;
  };

  const getPolicyPreviewUrl = (docUrl, profileData) => {
    const status = getPolicySignatureStatus(docUrl, profileData);
    return status?.signedPdfUrl || docUrl;
  };

  const isTextPolicy = (url = "") => {
    const clean = String(url).toLowerCase().split("?")[0];
    return clean.endsWith(".txt") || clean.endsWith(".md");
  };

  const isImagePolicy = (url = "") => {
    const clean = String(url).toLowerCase().split("?")[0];
    return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"].some((ext) => clean.endsWith(ext));
  };

  const openPolicyModal = async (url, previewUrl = url) => {
    setActivePolicyUrl(url);
    setActivePolicyPreviewUrl(previewUrl || url);
    setActivePolicyText("");
    setPolicyLoadError("");
    setShowPolicyModal(true);

    if (isTextPolicy(previewUrl || url)) {
      try {
        setPolicyLoading(true);
        const res = await fetch(previewUrl || url);
        const text = await res.text();
        setActivePolicyText(text);
      } catch (err) {
        setPolicyLoadError("Unable to load policy text.");
      } finally {
        setPolicyLoading(false);
      }
    }
  };

  const policyLinks = (() => {
    const docs = Array.isArray(profile?.policyDocuments) ? profile.policyDocuments.filter(Boolean) : [];
    if (!docs.length) return STATIC_POLICY_DOCS;
    const allLegacy = docs.every((d) => String(d || "").trim() === LEGACY_POLICY_DOC);
    return allLegacy ? STATIC_POLICY_DOCS : docs;
  })();

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar />
      <div className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen relative">
        {profile && (
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Employee Profile</p>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Real Name</p>
                  <p className="font-semibold text-slate-800">{profile.realName || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Pseudo Name</p>
                  <p className="font-semibold text-slate-800">{profile.pseudoName || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Employee ID</p>
                  <p className="font-semibold text-slate-800">{profile.empId || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Department</p>
                  <p className="font-semibold text-slate-800">{profile.department || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Designation</p>
                  <p className="font-semibold text-slate-800">{profile.designation || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Joining Date</p>
                  <p className="font-semibold text-slate-800">{formatDate(profile.dateOfJoining)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Policy Agreement</p>
              <p className="mt-3 text-sm text-slate-600">
                {profile.policyAgreement?.agreed
                  ? `Accepted on ${formatDate(profile.policyAgreement?.agreedAt)}`
                  : "Sign each policy document to complete onboarding."}
              </p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Policy Details</p>
                <p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                  {policyPreviewText || "Loading policy content..."}
                </p>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Docs:
                <div className="mt-1 flex flex-wrap gap-2">
                  {policyLinks.map((doc, idx) => (
                    <div key={`${doc}-${idx}`} className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white px-2 py-1">
                      <button
                        type="button"
                        onClick={() => openPolicyModal(doc, getPolicyPreviewUrl(doc, profile))}
                        className="rounded-full px-1.5 text-cyan-700 hover:bg-cyan-50"
                      >
                        {getPolicyName(doc)}
                      </button>
                      {getPolicySignatureStatus(doc, profile)?.employee?.signed ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Signed
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!profile && (
          <div className="mb-8">
            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Policy Agreement</p>
              <p className="mt-3 text-sm text-slate-600">Read and sign each policy document to complete onboarding.</p>
              <div className="mt-3 text-xs text-slate-500">
                Docs:
                <div className="mt-1 flex flex-wrap gap-2">
                  {policyLinks.map((doc, idx) => (
                    <div key={`${doc}-${idx}`} className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white px-2 py-1">
                      <button
                        type="button"
                        onClick={() => openPolicyModal(doc, getPolicyPreviewUrl(doc, profile))}
                        className="rounded-full px-1.5 text-cyan-700 hover:bg-cyan-50"
                      >
                        {getPolicyName(doc)}
                      </button>
                      {getPolicySignatureStatus(doc, profile)?.employee?.signed ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Signed
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPolicyModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Policy Document</p>
                <p className="text-xs text-slate-500">
                  Status:{" "}
                  {getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signed ? "Signed by you" : "Pending your signature"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(activePolicyPreviewUrl || activePolicyUrl) ? (
                  <a
                    href={activePolicyPreviewUrl || activePolicyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-cyan-200 px-3 py-1 text-sm text-cyan-700 hover:bg-cyan-50"
                  >
                    Download
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="h-[calc(85vh-56px)] overflow-auto p-4">
              {policyLoading && <p className="text-sm text-slate-500">Loading policy...</p>}
              {policyLoadError && <p className="text-sm text-rose-600">{policyLoadError}</p>}
              {!policyLoading && !policyLoadError && isTextPolicy(activePolicyPreviewUrl || activePolicyUrl) && (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {activePolicyText}
                </pre>
              )}
              {!policyLoading &&
                !policyLoadError &&
                !isTextPolicy(activePolicyPreviewUrl || activePolicyUrl) &&
                isImagePolicy(activePolicyPreviewUrl || activePolicyUrl) && (
                <img
                  src={activePolicyPreviewUrl || activePolicyUrl}
                  alt="Policy"
                  className="mx-auto max-h-[70vh] rounded-lg border border-slate-200"
                />
              )}
              {!policyLoading &&
                !policyLoadError &&
                !isTextPolicy(activePolicyPreviewUrl || activePolicyUrl) &&
                !isImagePolicy(activePolicyPreviewUrl || activePolicyUrl) && (
                <iframe
                  src={activePolicyPreviewUrl || activePolicyUrl}
                  title="Policy Preview"
                  className="h-[70vh] w-full rounded-lg border border-slate-200"
                />
              )}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Employee Signature</p>
                {getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signed ? (
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-700">
                      Already signed on {formatDate(getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signedAt)}
                    </p>
                    {getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signatureUrl && (
                      <img
                        src={getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signatureUrl}
                        alt="Employee signature"
                        className="max-h-28 rounded border border-emerald-200 bg-white p-2"
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">
                    Pending. Please contact HR to capture your signature from HR panel.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyProfile;
