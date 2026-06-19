import React, { memo, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { BadgeDollarSign } from "lucide-react";
import { employeeExitApi } from "../services/employeeExitService.js";

const fields = [
  ["salaryDuesCalculated", "Salary dues calculated"],
  ["incentivesCalculated", "Incentives calculated"],
  ["leaveEncashmentCalculated", "Leave encashment calculated"],
  ["statutoryDuesChecked", "Statutory dues checked"],
  ["recoveriesAdjusted", "Recoveries adjusted"],
  ["fnfProcessed", "FNF processed"],
];

const AccountsClearance = memo(({ exitId, disabled = false, onSubmitted }) => {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(([key]) => [key, false])));
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = useCallback((key) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const submit = async () => {
    try {
      setSaving(true);
      await employeeExitApi.accountsClearance(exitId, { ...form, remarks });
      toast.success("Accounts FNF clearance submitted");
      onSubmitted?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit Accounts FNF clearance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <BadgeDollarSign className="h-5 w-5 text-teal-700" />
        <h2 className="text-base font-semibold text-slate-900">Accounts FNF Clearance</h2>
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
        placeholder="Accounts remarks"
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
      <button
        type="button"
        disabled={disabled || saving}
        onClick={submit}
        className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Submitting..." : "Submit Accounts FNF"}
      </button>
    </div>
  );
});

AccountsClearance.displayName = "AccountsClearance";

export default AccountsClearance;
