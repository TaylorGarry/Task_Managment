import React, { memo, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { employeeExitApi } from "../services/employeeExitService.js";

const fields = [
  ["laptopReturned", "Laptop returned"],
  ["chargerReturned", "Charger returned"],
  ["idCardReturned", "ID card returned"],
  ["mouseReturned", "Mouse returned"],
  ["simReturned", "SIM returned"],
  ["otherAssetsReturned", "Other assets returned"],
  ["emailDisabled", "Email disabled"],
  ["crmAccessRemoved", "CRM access removed"],
  ["gatePunchRemoved", "Gate punch removed"],
  ["vpnRemoved", "VPN removed"],
  ["githubRemoved", "GitHub removed"],
  ["googleWorkspaceRemoved", "Google Workspace removed"],
  ["slackRemoved", "Slack removed"],
];

const ITVerification = memo(({ exitId, disabled = false, onSubmitted }) => {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(([key]) => [key, false])));
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = useCallback((key) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const submit = async () => {
    try {
      setSaving(true);
      await employeeExitApi.itClearance(exitId, { ...form, remarks });
      toast.success("IT clearance submitted");
      onSubmitted?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit IT clearance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-blue-700" />
        <h2 className="text-base font-semibold text-slate-900">IT Verification</h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" checked={form[key]} disabled={disabled || saving} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
      </div>
      <textarea
        value={remarks}
        onChange={(event) => setRemarks(event.target.value)}
        disabled={disabled || saving}
        rows={3}
        placeholder="IT remarks"
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <button
        type="button"
        disabled={disabled || saving}
        onClick={submit}
        className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Submitting..." : "Submit IT Clearance"}
      </button>
    </div>
  );
});

ITVerification.displayName = "ITVerification";

export default ITVerification;
