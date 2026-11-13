import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import SignaturePad from "../components/SignaturePad.jsx";
import { getUrlToken } from "../utils/urlToken.js";

const API_URL =
  import.meta.env?.VITE_API_URL ||
  "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1"
// "http://localhost:4000/api/v1";

const EmployeeOnboardingEsign = () => {
  const [token] = useState(getUrlToken());
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [signingKey, setSigningKey] = useState("");
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // One pad instance per policy
  const padRefs = useRef({});

  const load = async () => {
    if (!token) {
      setErrorMsg("Invalid onboarding link");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(
        `${API_URL}/employee/onboarding/v2/esign/verify`,
        { params: { token } }
      );
      setEmployee(res.data?.employee || null);
      setPolicies(res.data?.policies || []);
      setDone(!!res.data?.alreadyCompleted);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Invalid or expired link");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearPad = (key) => {
    padRefs.current[key]?.clear();
  };

  const signPolicy = async (key) => {
    const pad = padRefs.current[key];
    if (!pad || pad.isEmpty()) {
      return toast.error("Please draw your signature first");
    }

    // Draw → base64 PNG
    const signatureDataUrl = pad.toDataURL();

    setSigningKey(key);
    try {
      const res = await axios.post(
        `${API_URL}/employee/onboarding/v2/esign/sign`,
        { token, policyKey: key, signatureDataUrl }
      );
      toast.success("Signed");
      if (res.data?.allSigned) setDone(true);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to sign");
    } finally {
      setSigningKey("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }

  if (errorMsg || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-600">
        {errorMsg || "Invalid or expired onboarding link."}
      </div>
    );
  }

  const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Review &amp; E-Sign Policies
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Hello {employee.realName}, please review each policy and draw your
          signature below. This link can be used <strong>only once</strong>.
        </p>

        {done && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            ✅ All policies signed. Thank you!
          </div>
        )}

        <div className="mt-6 space-y-4">
          {policies.map((p) => (
            <div key={p.key} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {p.title || p.key}
                  </p>
                  <a
                    href={`${API_ORIGIN}${p.documentUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    View PDF
                  </a>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${p.signed
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {p.signed ? "Signed" : "Pending"}
                </span>
              </div>

              {!p.signed && !done && (
                <div className="mt-4">
                  <div className="rounded-lg border border-slate-300 bg-white">
                    <SignaturePad ref={(el) => (padRefs.current[p.key] = el)} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Sign with mouse, touch, or pen device.
                    </p>
                    <button
                      type="button"
                      onClick={() => clearPad(p.key)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => signPolicy(p.key)}
                    disabled={signingKey === p.key}
                    className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {signingKey === p.key ? "Signing…" : "Save Signature"}
                  </button>
                </div>
              )}

              {p.signed && (
                <p className="mt-3 text-xs text-emerald-700">Signed ✓</p>
              )}
            </div>
          ))}

          {policies.length === 0 && !done && (
            <p className="text-sm text-slate-500">
              No policies found for signing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingEsign;