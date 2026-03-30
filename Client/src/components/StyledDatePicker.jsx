import React, { useEffect, useMemo, useRef, useState } from "react";

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toKey = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatLabel = (date) =>
  date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

const StyledDatePicker = ({ value, onChange, disabled = false, placeholder = "Select date" }) => {
  const [open, setOpen] = useState(false);
  const parsed = toDate(value);
  const [cursor, setCursor] = useState(parsed || new Date());
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (parsed) setCursor(parsed);
  }, [value]);

  const days = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const firstDay = first.getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let i = 1; i <= total; i += 1) cells.push(new Date(y, m, i));
    return cells;
  }, [cursor]);

  const selectedKey = parsed ? toKey(parsed) : "";

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-slate-900 transition focus:border-cyan-500 focus:bg-white disabled:opacity-60"
      >
        {parsed ? formatLabel(parsed) : <span className="text-slate-400">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute z-[120] mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
            >
              {"<"}
            </button>
            <p className="text-sm font-semibold text-slate-800">
              {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
            >
              {">"}
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-xs text-slate-500">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, idx) =>
              d ? (
                <button
                  key={toKey(d)}
                  type="button"
                  onClick={() => {
                    onChange(toKey(d));
                    setOpen(false);
                  }}
                  className={`rounded-md py-1 text-sm ${
                    toKey(d) === selectedKey
                      ? "bg-cyan-600 font-semibold text-white"
                      : "text-slate-700 hover:bg-cyan-50"
                  }`}
                >
                  {d.getDate()}
                </button>
              ) : (
                <span key={`empty-${idx}`} />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyledDatePicker;
