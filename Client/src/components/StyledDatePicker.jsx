import React, { useEffect, useMemo, useRef, useState } from "react";

const toDate = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }
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

const isBeforeDay = (a, b) => {
  if (!a || !b) return false;
  return new Date(a.getFullYear(), a.getMonth(), a.getDate()) < new Date(b.getFullYear(), b.getMonth(), b.getDate());
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const isOnOrAfter = (a, b) => !isBeforeDay(a, b);

const inRangeInclusive = (date, start, end) => {
  if (!date || !start || !end) return false;
  const from = isBeforeDay(start, end) ? start : end;
  const to = isBeforeDay(start, end) ? end : start;
  return isOnOrAfter(date, from) && isOnOrAfter(to, date);
};

const StyledDatePicker = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select date",
  minDate = "",
  initialViewDate = "",
  referenceDate = "",
  rangeStart = "",
  rangeEnd = "",
}) => {
  const [open, setOpen] = useState(false);
  const parsed = toDate(value);
  const minParsed = toDate(minDate);
  const initialParsed = toDate(initialViewDate);
  const referenceParsed = toDate(referenceDate);
  const rangeStartParsed = toDate(rangeStart);
  const rangeEndParsed = toDate(rangeEnd);
  const [cursor, setCursor] = useState(parsed || initialParsed || minParsed || new Date());
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
    const totalCurrent = new Date(y, m + 1, 0).getDate();
    const totalPrev = new Date(y, m, 0).getDate();
    const cells = [];

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      cells.push({ date: new Date(y, m - 1, totalPrev - i), inMonth: false });
    }
    for (let i = 1; i <= totalCurrent; i += 1) {
      cells.push({ date: new Date(y, m, i), inMonth: true });
    }
    let nextDay = 1;
    while (cells.length < 42) {
      cells.push({ date: new Date(y, m + 1, nextDay), inMonth: false });
      nextDay += 1;
    }

    return cells;
  }, [cursor]);

  const selectedKey = parsed ? toKey(parsed) : "";

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) {
            setCursor(parsed || initialParsed || minParsed || new Date());
          }
          setOpen((s) => !s);
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-slate-900 font-medium transition focus:border-cyan-500 focus:bg-white disabled:opacity-60"
      >
        {parsed ? formatLabel(parsed) : <span className="text-slate-400">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute z-[120] mt-2 w-[310px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.22em] text-slate-700">
              {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
            </p>
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
            >
              {"‹"}
            </button>
            <button
              type="button"
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
            >
              {"›"}
            </button>
            </div>
          </div>
          <div className="mb-2 grid grid-cols-7 text-center text-sm font-medium text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2">
            {days.map(({ date, inMonth }) => {
              const dayKey = toKey(date);
              const isSelected = dayKey === selectedKey;
              const isDisabled = Boolean(minParsed && isBeforeDay(date, minParsed));
              const isReference = Boolean(referenceParsed && isSameDay(date, referenceParsed));
              const isInRange = Boolean(
                rangeStartParsed &&
                  rangeEndParsed &&
                  inRangeInclusive(date, rangeStartParsed, rangeEndParsed)
              );
              return (
                <button
                  key={dayKey}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(dayKey);
                    setOpen(false);
                  }}
                  className={`mx-auto flex h-9 w-9 items-center justify-center text-[20px] leading-none transition ${
                    isSelected
                      ? "rounded-full bg-blue-600 font-semibold text-white shadow-sm"
                      : isInRange
                      ? "rounded-lg bg-blue-100 text-blue-700 font-semibold"
                      : isDisabled
                      ? "text-slate-200 cursor-not-allowed"
                      : isReference
                      ? "rounded-full ring-2 ring-blue-300 text-blue-700 font-semibold bg-blue-50"
                      : inMonth
                      ? "text-slate-800 rounded-full hover:bg-slate-100"
                      : "text-slate-300"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyledDatePicker;
