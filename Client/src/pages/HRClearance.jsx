import React, { memo, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Workflow } from "lucide-react";
import { employeeExitApi } from "../services/employeeExitService.js";

const fields = [
  ["exitInterviewDone", "Exit interview done"],
  ["leaveAdjusted", "Leave adjusted"],
  ["experienceLetterIssued", "Experience letter issued"],
  ["relievingLetterIssued", "Relieving letter issued"],
  ["documentsUploaded", "Documents uploaded"],
];

const HRClearance = memo(({ exitId, disabled = false, onSubmitted }) => {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(([key]) => [key, false])));
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = useCallback((key) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const submit = async () => {
    try {
      setSaving(true);
      await employeeExitApi.hrClearance(exitId, { ...form, remarks });
      toast.success("HR clearance submitted");
      onSubmitted?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit HR clearance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Workflow className="h-5 w-5 text-amber-700" />
        <h2 className="text-base font-semibold text-slate-900">HR Clearance</h2>
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
        placeholder="HR remarks"
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      />
      <button
        type="button"
        disabled={disabled || saving}
        onClick={submit}
        className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Submitting..." : "Submit HR Clearance"}
      </button>
    </div>
  );
});

HRClearance.displayName = "HRClearance";

export default HRClearance;
