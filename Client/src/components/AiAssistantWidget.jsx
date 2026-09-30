import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  X,
  Loader2,
  Plus,
  Trash2,
  Check,
  Copy,
  ArrowLeft,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useSelector } from "react-redux";
import api from "../../api.js";

/*
|--------------------------------------------------------------------------
| Attendance configuration
|--------------------------------------------------------------------------
| Keep these aligned with the statuses supported by your backend/schema.
| We will later make the backend the final source of truth.
*/
const ATTENDANCE_STATUSES = [
  "P",
  "A",
  "WO",
  "L",
  "NCNS",
  "UL",
  "LWP",
  "BL",
  "FL",
  "H",
  "LWD",
  "HD",
  "OT",
  "FWO",
  "EXIT",
];

const TIME_REQUIRED_STATUSES = ["P"];

/*
|--------------------------------------------------------------------------
| Initial chatbot message
|--------------------------------------------------------------------------
*/
const starterMessages = [
  {
    role: "assistant",
    text: "Hi! I can help you view attendance, update attendance, or reuse rosters. Choose an action below or type your request.",
  },
];

/*
|--------------------------------------------------------------------------
| Quick actions
|--------------------------------------------------------------------------
*/
const quickActions = [
  {
    label: "Update Attendance",
    description: "Update one or multiple employees",
    type: "attendance",
  },
  {
    label: "Update Team Attendance",
    description: "Update your whole team",
    prompt: "update my team attendance today",
  },
  {
    label: "View Attendance",
    description: "Check attendance status",
    prompt: "show my attendance today",
  },
  {
    label: "Reuse Roster",
    description: "Pick source and target weeks",
    type: "rosterReuse",
  },
];

const assistantCommandHelp = [
  {
    command: "show my team attendance today",
    note: "Works for Team Leader, HR, and Super Admin accounts.",
  },
  {
    command: "show my attendance today",
    note: "Works for every employee.",
  },
  {
    command: "update my team attendance today",
    note: "Team Leader, HR, and Super Admin can update only their own team. Add the status and time, then confirm with yes.",
  },
  {
    command: "show emp_name attendance today",
    note: "Team Leader can view only their own team. HR and Super Admin can view any employee.",
  },
  {
    command: "Mark emp_name P at 6:38 PM today",
    note: "Team Leader, HR, and Super Admin can use this if the employee is under their team.",
  },
  {
    command: "Mark emp_name P at 6:38 PM 2026-08-17",
    note: "Use this when you need a date-specific attendance update.",
  },
  {
    command: "Mark emp_name WO today",
    note: "You can replace WO with LWP, UL, NCNS, or any other supported status.",
  },
  {
    command: "show my team attendance this week",
    note: "Works for Team Leader, HR, and Super Admin accounts.",
  },
  {
    command: "show my attendance this week",
    note: "Works for every employee.",
  },
];

/*
|--------------------------------------------------------------------------
| Empty attendance row
|--------------------------------------------------------------------------
*/
const createEmptyRow = () => ({
  id: `${Date.now()}-${Math.random()}`,
  employeeName: "",
  status: "",
  arrivalTime: "",
});

const CONFIRM_WORDS = new Set([
  "yes",
  "confirm",
  "approved",
  "approve",
  "go ahead",
  "do it",
  "proceed",
]);

const rosterReuseEmployeeKey = (employee = {}) =>
  String(
    employee.key ||
      employee.userId ||
      employee.employeeId ||
      employee.empId ||
      employee.name ||
      ""
  )
    .trim()
    .toLowerCase();

const cloneRosterReusePreview = (preview = {}) => {
  const previewDays = Array.isArray(preview.days) ? preview.days : [];
  const fallbackDays = Array.isArray(preview.employees?.[0]?.dailyStatus)
    ? preview.employees[0].dailyStatus.map((day) => ({
        date: day?.date || "",
        label: day?.label || day?.date || "",
      }))
    : [];
  const days = previewDays.length ? previewDays : fallbackDays;

  return {
    ...preview,
    days: days.map((day) => ({
      date: String(day?.date || "").trim(),
      label: String(day?.label || day?.date || "").trim(),
    })),
    employees: Array.isArray(preview.employees)
      ? preview.employees.map((employee) => ({
          ...employee,
          dailyStatus: Array.isArray(employee.dailyStatus)
            ? employee.dailyStatus.map((day, dayIndex) => ({
                date: String(day?.date || days[dayIndex]?.date || "").trim(),
                label: String(day?.label || days[dayIndex]?.label || day?.date || "").trim(),
                status: String(day?.status || "").trim(),
              }))
            : days.map((day) => ({
                date: day.date,
                label: day.label,
                status: "",
              })),
        }))
      : [],
  };
};

const isConfirmMessage = (value = "") =>
  CONFIRM_WORDS.has(String(value || "").trim().toLowerCase());

const padDatePart = (value) => String(value).padStart(2, "0");

const toDateInputValue = (date) => {
  const local = new Date(date);
  if (Number.isNaN(local.getTime())) return "";
  return `${local.getFullYear()}-${padDatePart(local.getMonth() + 1)}-${padDatePart(local.getDate())}`;
};

const addLocalDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfLocalIsoWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
};

const createEmptyRosterReuseForm = () => {
  const today = new Date();
  const currentWeekStart = startOfLocalIsoWeek(today);
  const previousWeekStart = addLocalDays(currentWeekStart, -7);
  const nextWeekStart = addLocalDays(currentWeekStart, 7);

  return {
    sourceStartDate: toDateInputValue(previousWeekStart),
    sourceEndDate: toDateInputValue(addLocalDays(previousWeekStart, 6)),
    targetStartDate: toDateInputValue(nextWeekStart),
    targetEndDate: toDateInputValue(addLocalDays(nextWeekStart, 6)),
  };
};

const buildRosterReuseCommand = (form = {}) => {
  const sourceStartDate = String(form.sourceStartDate || "").trim();
  const sourceEndDate = String(form.sourceEndDate || "").trim();
  const targetStartDate = String(form.targetStartDate || "").trim();
  const targetEndDate = String(form.targetEndDate || "").trim();

  return `reuse roster source ${sourceStartDate} to ${sourceEndDate} target ${targetStartDate} to ${targetEndDate}`;
};

/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
*/
const AiAssistantWidget = () => {
  const { user } = useSelector((state) => state.auth);

  const [open, setOpen] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);

  const [messages, setMessages] = useState(starterMessages);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Attendance editor state
  |--------------------------------------------------------------------------
  */
  const [showAttendanceEditor, setShowAttendanceEditor] =
    useState(false);

  const [attendanceRows, setAttendanceRows] = useState([
    createEmptyRow(),
  ]);

  const [reviewMode, setReviewMode] = useState(false);

  const [attendanceStatusOptions, setAttendanceStatusOptions] =
    useState(ATTENDANCE_STATUSES);

  const [rosterReuseDraft, setRosterReuseDraft] =
    useState(null);

  const [showRosterReuseForm, setShowRosterReuseForm] =
    useState(false);

  const [rosterReuseForm, setRosterReuseForm] =
    useState(createEmptyRosterReuseForm());

  const [showCommandHelp, setShowCommandHelp] = useState(false);

  const [copiedCommand, setCopiedCommand] = useState("");

  const scrollRef = useRef(null);
  const copiedCommandTimerRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Refs for automatic focus
  |--------------------------------------------------------------------------
  */
  const employeeRefs = useRef({});
  const statusRefs = useRef({});
  const timeRefs = useRef({});

  const userSessionKey =
    user?._id ||
    user?.id ||
    user?.username ||
    "";

  /*
  |--------------------------------------------------------------------------
  | Reset assistant when authenticated user changes
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    setOpen(false);
    setPanelExpanded(false);
    setMessages(starterMessages);
    setInput("");
    setLoading(false);
    setConversationId("");
    setShowAttendanceEditor(false);
    setAttendanceRows([createEmptyRow()]);
    setReviewMode(false);
    setRosterReuseDraft(null);
    setShowRosterReuseForm(false);
    setRosterReuseForm(createEmptyRosterReuseForm());
    setShowCommandHelp(false);
    setCopiedCommand("");

    localStorage.removeItem(
      "aiAssistant:conversationId"
    );

    sessionStorage.removeItem(
      "aiAssistant:conversationId"
    );

    localStorage.removeItem(
      "aiAssistant:messages"
    );

    sessionStorage.removeItem(
      "aiAssistant:messages"
    );
  }, [userSessionKey]);

  useEffect(() => {
    return () => {
      if (copiedCommandTimerRef.current) {
        clearTimeout(copiedCommandTimerRef.current);
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load backend conversation state
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!open || !user?.token) return;

    api
      .get("/api/v1/ai-assistant/state")
      .then((res) => {
        setConversationId(
          res.data?.conversationId || ""
        );

        if (
          Array.isArray(res.data?.messages) &&
          res.data.messages.length
        ) {
          setMessages(res.data.messages);
        }

        if (
          Array.isArray(res.data?.attendanceStatuses) &&
          res.data.attendanceStatuses.length
        ) {
          setAttendanceStatusOptions(
            res.data.attendanceStatuses
          );
        }

        const pending = res.data?.pendingAction;

        if (!pending) return;

        if (pending.action === "REUSE_ROSTER" && pending.preview) {
          setShowRosterReuseForm(false);
          setRosterReuseDraft(
            cloneRosterReusePreview(pending.preview)
          );
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Pending ${pending.action}. Say Confirm to proceed or Cancel to abort.`,
          },
        ]);
      })
      .catch(() => {});
  }, [
    open,
    user?.token,
    userSessionKey,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Auto scroll chat
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [
    messages,
    loading,
    open,
    showAttendanceEditor,
    reviewMode,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Don't show AI assistant when not authenticated
  |--------------------------------------------------------------------------
  */
  if (!user?.token) return null;

  /*
  |--------------------------------------------------------------------------
  | Normalise status
  |--------------------------------------------------------------------------
  */
  const normalizeStatus = (value) => {
    return value
      .trim()
      .toUpperCase();
  };

  const safeText = (value) => String(value ?? "").trim();

  /*
  |--------------------------------------------------------------------------
  | Check whether status requires time
  |--------------------------------------------------------------------------
  */
  const statusRequiresTime = (status) => {
    return TIME_REQUIRED_STATUSES.includes(
      normalizeStatus(status)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Build structured attendance message
  |-------------------------------------------------------------------------- 
  */
  const buildAttendancePrompt = (rows) => {
    if (!rows.length) {
      return "";
    }

    const items = rows.map((row) => {
      const employeeName = safeText(row.employeeName);
      const status = safeText(row.status);
      const text = `${employeeName} ${status}`.trim();
      return row.arrivalTime ? `${text} at ${safeText(row.arrivalTime)}` : text;
    });

    const dateText = safeText(rows[0]?.dateText) || "today";
    return `Mark ${items.join(" and ")} ${dateText}`.trim();
  };

  /*
  |--------------------------------------------------------------------------
  | Render chat text with light emphasis
  |--------------------------------------------------------------------------
  */
  const parseAttendanceSections = (message) => {
    const lines = String(message || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const sections = [];
    let current = null;

    for (const line of lines) {
      if (/^Date:\s*/i.test(line)) {
        if (current) sections.push(current);
        current = {
          date: line.replace(/^Date:\s*/i, "").trim(),
          headers: null,
          rows: [],
        };
        continue;
      }

      if (line.includes("|")) {
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        if (!current) {
          current = { date: "", headers: null, rows: [] };
        }

        if (!current.headers) current.headers = cells;
        else current.rows.push(cells);
        continue;
      }

      if (current) {
        current.rows.push([line]);
      } else {
        sections.push({ plain: line });
      }
    }

    if (current) sections.push(current);
    return sections;
  };

  const renderCompactAttendanceMessage = (message) => {
    const sections = parseAttendanceSections(message);
    const hasTable = sections.some(
      (section) => Array.isArray(section.headers) && section.headers.length && section.rows.length
    );

    if (!hasTable) {
      return null;
    }

    return (
      <div className="space-y-3">
        {sections.map((section, sectionIndex) => {
          if (section.plain) {
            return (
              <div
                key={`plain-${sectionIndex}`}
                className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
              >
                {section.plain}
              </div>
            );
          }

          const columns = Math.max(section.headers?.length || 0, 1);
          return (
            <div
              key={`section-${sectionIndex}`}
              className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)]"
            >
              {section.date ? (
                <div className="border-b border-slate-200/80 px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Date
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {section.date}
                  </div>
                </div>
              ) : null}

              {Array.isArray(section.headers) && section.headers.length ? (
                <div
                  className="grid gap-0 border-b border-slate-200/80 bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {section.headers.map((header) => (
                    <div key={header} className="pr-2">
                      {header}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="divide-y divide-slate-100">
                {(section.rows || []).map((row, rowIndex) => (
                  <div
                    key={`row-${sectionIndex}-${rowIndex}`}
                    className="grid gap-0 px-4 py-3 text-sm text-slate-700"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(
                        section.headers?.length || row.length || 1,
                        1
                      )}, minmax(0, 1fr))`,
                    }}
                  >
                    {row.map((cell, cellIndex) => {
                      const value = String(cell || "").trim();
                      const isStatus = /^[A-Z]{1,4}$/.test(value) || /present|absent/i.test(value);
                      return (
                        <div
                          key={`${rowIndex}-${cellIndex}`}
                          className={cellIndex === 0 ? "pr-2 font-medium text-slate-900" : "pr-2"}
                        >
                          {cellIndex === 0 ? (
                            value
                          ) : isStatus ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                              {value}
                            </span>
                          ) : (
                            value
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMessageText = (message) => {
    const text = String(message || "");
    const compactAttendance = renderCompactAttendanceMessage(text);
    if (compactAttendance) {
      return compactAttendance;
    }

    if (!text.includes(":")) {
      return text;
    }

    return text.split("\n").map((line, lineIndex) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) {
        return (
          <span key={`${lineIndex}-${line}`}>
            {line}
            {lineIndex < text.split("\n").length - 1 ? "\n" : ""}
          </span>
        );
      }

      const label = line.slice(0, colonIndex + 1);
      const value = line.slice(colonIndex + 1).trim();
      return (
        <span key={`${lineIndex}-${line}`}>
          <span className="font-semibold text-slate-900">
            {label}
          </span>{" "}
          <span>{value}</span>
          {lineIndex < text.split("\n").length - 1 ? "\n" : ""}
        </span>
      );
    });
  };

  const updateRosterReuseCell = (
    employeeKey,
    dateKey,
    value
  ) => {
    const normalizedEmployeeKey = String(employeeKey || "")
      .trim()
      .toLowerCase();
    const normalizedDateKey = String(dateKey || "").trim();
    const nextStatus = String(value || "").trim();

    setRosterReuseDraft((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        employees: (previous.employees || []).map((employee) => {
          if (rosterReuseEmployeeKey(employee) !== normalizedEmployeeKey) {
            return employee;
          }

          return {
            ...employee,
            dailyStatus: (employee.dailyStatus || []).map((day) => {
              if (String(day.date || "").trim() !== normalizedDateKey) {
                return day;
              }

              return {
                ...day,
                status: nextStatus,
              };
            }),
          };
        }),
      };
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Update row
  |--------------------------------------------------------------------------
  */
  const updateAttendanceRow = (
    rowId,
    field,
    value
  ) => {
    setAttendanceRows((previousRows) =>
      previousRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const updatedRow = {
          ...row,
          [field]: value,
        };

        /*
        |--------------------------------------------------------------------------
        | If status does not require time, remove old time
        |--------------------------------------------------------------------------
        */
        if (
          field === "status" &&
          !statusRequiresTime(value)
        ) {
          updatedRow.arrivalTime = "";
        }

        return updatedRow;
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Employee input handler
  |--------------------------------------------------------------------------
  */
  const handleEmployeeChange = (
    rowId,
    value
  ) => {
    updateAttendanceRow(
      rowId,
      "employeeName",
      value
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Employee Enter
  |--------------------------------------------------------------------------
  | Move focus to Status
  */
  const handleEmployeeKeyDown = (
    event,
    rowId
  ) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    statusRefs.current[rowId]?.focus();
  };

  /*
  |--------------------------------------------------------------------------
  | Status input
  |--------------------------------------------------------------------------
  */
  const handleStatusChange = (
    rowId,
    value
  ) => {
    updateAttendanceRow(
      rowId,
      "status",
      normalizeStatus(value)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Status keyboard flow
  |--------------------------------------------------------------------------
  */
  const handleStatusKeyDown = (
    event,
    row
  ) => {
    if (
      event.key !== "Enter" &&
      event.key !== "Tab"
    ) {
      return;
    }

    const status = normalizeStatus(
      row.status
    );

    if (!attendanceStatusOptions.includes(status)) {
      return;
    }

    if (
      event.key === "Enter"
    ) {
      event.preventDefault();
    }

    /*
    |--------------------------------------------------------------------------
    | P requires arrival time
    |--------------------------------------------------------------------------
    */
    if (statusRequiresTime(status)) {
      timeRefs.current[row.id]?.focus();
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Other statuses skip time
    |--------------------------------------------------------------------------
    */
    const currentIndex =
      attendanceRows.findIndex(
        (item) => item.id === row.id
      );

    const nextRow =
      attendanceRows[currentIndex + 1];

    if (nextRow) {
      employeeRefs.current[
        nextRow.id
      ]?.focus();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Time keyboard flow
  |--------------------------------------------------------------------------
  */
  const handleTimeKeyDown = (
    event,
    row
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const currentIndex =
      attendanceRows.findIndex(
        (item) => item.id === row.id
      );

    const nextRow =
      attendanceRows[currentIndex + 1];

    if (nextRow) {
      employeeRefs.current[
        nextRow.id
      ]?.focus();

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Automatically add another row
    |--------------------------------------------------------------------------
    */
    const newRow = createEmptyRow();

    setAttendanceRows((previousRows) => [
      ...previousRows,
      newRow,
    ]);

    setTimeout(() => {
      employeeRefs.current[
        newRow.id
      ]?.focus();
    }, 50);
  };

  /*
  |--------------------------------------------------------------------------
  | Add employee row
  |--------------------------------------------------------------------------
  */
  const addAttendanceRow = () => {
    const newRow = createEmptyRow();

    setAttendanceRows((previousRows) => [
      ...previousRows,
      newRow,
    ]);

    setTimeout(() => {
      employeeRefs.current[
        newRow.id
      ]?.focus();
    }, 50);
  };

  /*
  |--------------------------------------------------------------------------
  | Remove employee row
  |--------------------------------------------------------------------------
  */
  const removeAttendanceRow = (rowId) => {
    if (attendanceRows.length === 1) {
      return;
    }

    setAttendanceRows((previousRows) =>
      previousRows.filter(
        (row) => row.id !== rowId
      )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Validate attendance rows
  |--------------------------------------------------------------------------
  */
  const validateAttendanceRows = () => {
    const validRows = attendanceRows.filter(
      (row) =>
        safeText(row.employeeName) ||
        safeText(row.status) ||
        safeText(row.arrivalTime)
    );

    if (!validRows.length) {
      return {
        valid: false,
        message:
          "Please enter at least one employee.",
      };
    }

    for (const row of validRows) {
      if (!safeText(row.employeeName)) {
        return {
          valid: false,
          message:
            "Please enter an employee name for every row.",
        };
      }

      const status =
        normalizeStatus(row.status);

      if (!status) {
        return {
          valid: false,
          message: `Please enter a status for ${row.employeeName}.`,
        };
      }

      if (!attendanceStatusOptions.includes(status)) {
        return {
          valid: false,
          message: `${status} is not a valid attendance status.`,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | P requires arrival time
      |--------------------------------------------------------------------------
      */
      if (
        statusRequiresTime(status) &&
        !safeText(row.arrivalTime)
      ) {
        return {
          valid: false,
          message: `Please enter arrival time for ${safeText(row.employeeName)}.`,
        };
      }
    }

    return {
      valid: true,
      rows: validRows.map((row) => ({
        employeeName:
          safeText(row.employeeName),
        status:
          normalizeStatus(row.status),
        arrivalTime:
          safeText(row.arrivalTime) || null,
      })),
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Open attendance editor
  |--------------------------------------------------------------------------
  */
  const openAttendanceEditor = () => {
    setShowAttendanceEditor(true);
    setReviewMode(false);

    setAttendanceRows([
      createEmptyRow(),
    ]);

    setTimeout(() => {
      const firstRow =
        attendanceRows[0];

      if (firstRow) {
        employeeRefs.current[
          firstRow.id
        ]?.focus();
      }
    }, 100);
  };

  /*
  |--------------------------------------------------------------------------
  | Close attendance editor
  |--------------------------------------------------------------------------
  */
  const closeAttendanceEditor = () => {
    setShowAttendanceEditor(false);
    setReviewMode(false);
    setAttendanceRows([
      createEmptyRow(),
    ]);
  };

  /*
  |--------------------------------------------------------------------------
  | Review attendance
  |--------------------------------------------------------------------------
  */
  const reviewAttendance = () => {
    const result =
      validateAttendanceRows();

    if (!result.valid) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: result.message,
        },
      ]);

      return;
    }

    setAttendanceRows(
      result.rows.map((row, index) => ({
        ...row,
        id:
          attendanceRows[index]?.id ||
          `${Date.now()}-${index}`,
      }))
    );

    setReviewMode(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Submit attendance update
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Backend integration will be connected here after you share
  | your AI assistant / attendance backend code.
  |--------------------------------------------------------------------------
  */
  const confirmAttendanceUpdate =
    async () => {
      const result =
        validateAttendanceRows();

      if (!result.valid) {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            text: result.message,
          },
        ]);

        return;
      }

      try {
        setLoading(true);

        const response = await api.post(
          "/api/v1/ai-assistant/message",
          {
            message: buildAttendancePrompt(result.rows),
            conversationId,
          }
        );

        const reply =
          response.data?.reply ||
          "I sent the attendance update request to the assistant.";

        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            text: reply,
          },
        ]);

        closeAttendanceEditor();
      } catch (error) {
        console.error(
          "Attendance update failed:",
          error
        );

        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            text:
              error.response?.data?.message ||
              "I could not update the attendance. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Normal chatbot message
  |--------------------------------------------------------------------------
  */
  const sendAssistantMessage = async ({
    text,
    extraBody = {},
    clearInput = false,
  }) => {
    const messageText = String(text || "").trim();

    if (!messageText || loading) {
      return null;
    }

    if (clearInput) {
      setInput("");
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: messageText,
      },
    ]);

    setLoading(true);

    try {
      const response = await api.post(
        "/api/v1/ai-assistant/message",
        {
          message: messageText,
          conversationId,
          ...extraBody,
        }
      );

      if (response.data?.conversationId) {
        setConversationId(
          response.data.conversationId
        );
      }

      if (
        response.data?.type === "confirmation_required" &&
        response.data?.action === "REUSE_ROSTER" &&
        response.data?.preview
      ) {
        setRosterReuseDraft(
          cloneRosterReusePreview(response.data.preview)
        );
      }

      if (
        response.data?.type === "execution_result" &&
        response.data?.action === "REUSE_ROSTER"
      ) {
        setRosterReuseDraft(null);
      }

      if (response.data?.type === "cancel") {
        setRosterReuseDraft(null);
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            response.data?.reply ||
            "I could not process that request.",
        },
      ]);

      return response.data || null;
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            error.response?.data?.message ||
            "AI Assistant request failed.",
        },
      ]);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    const extraBody =
      rosterReuseDraft && isConfirmMessage(text)
        ? { rosterReuseDraft }
        : {};
    await sendAssistantMessage({
      text,
      extraBody,
      clearInput: true,
    });
  };

  const openRosterReuseForm = () => {
    if (loading) return;
    setRosterReuseDraft(null);
    setShowAttendanceEditor(false);
    setAttendanceRows([createEmptyRow()]);
    setReviewMode(false);
    setRosterReuseForm(createEmptyRosterReuseForm());
    setShowRosterReuseForm(true);
    setInput("");
  };

  const closeRosterReuseForm = () => {
    if (loading) return;
    setShowRosterReuseForm(false);
    setRosterReuseForm(createEmptyRosterReuseForm());
  };

  const updateRosterReuseForm = (field, value) => {
    setRosterReuseForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const submitRosterReuseForm = async () => {
    if (loading) return;

    const sourceStartDate = String(rosterReuseForm.sourceStartDate || "").trim();
    const sourceEndDate = String(rosterReuseForm.sourceEndDate || "").trim();
    const targetStartDate = String(rosterReuseForm.targetStartDate || "").trim();
    const targetEndDate = String(rosterReuseForm.targetEndDate || "").trim();

    if (!sourceStartDate || !sourceEndDate || !targetStartDate || !targetEndDate) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Please pick both source and target week date ranges.",
        },
      ]);
      return;
    }

    if (sourceStartDate > sourceEndDate || targetStartDate > targetEndDate) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Each week needs a start date that is on or before its end date.",
        },
      ]);
      return;
    }

    setShowRosterReuseForm(false);
    await sendAssistantMessage({
      text: buildRosterReuseCommand(rosterReuseForm),
      clearInput: false,
    });
  };

  const confirmRosterReuse = async () => {
    if (!rosterReuseDraft || loading) {
      return;
    }

    await sendAssistantMessage({
      text: "confirm",
      extraBody: {
        rosterReuseDraft,
      },
      clearInput: false,
    });
  };

  const cancelRosterReuse = async () => {
    if (loading) {
      return;
    }

    await sendAssistantMessage({
      text: "cancel",
      clearInput: false,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Chat keyboard handler
  |--------------------------------------------------------------------------
  */
  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Use quick action
  |--------------------------------------------------------------------------
  */
  const handleQuickAction = (
    action
  ) => {
    if (loading) return;

    if (action.type === "attendance") {
      openAttendanceEditor();
      return;
    }

    if (action.type === "rosterReuse") {
      openRosterReuseForm();
      return;
    }

    setInput(action.prompt);
  };

  const copyAssistantCommand = async (command) => {
    const text = String(command || "").trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(text);
      if (copiedCommandTimerRef.current) {
        clearTimeout(copiedCommandTimerRef.current);
      }
      copiedCommandTimerRef.current = setTimeout(() => {
        setCopiedCommand("");
      }, 1600);
    } catch {
      setInput(text);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */
  return (
    <>
      {open && (
        <section
          className={`fixed z-[9998] flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] ${
            panelExpanded
              ? "bottom-4 right-4 h-[calc(100vh-2rem)] w-[min(760px,calc(100vw-2rem))]"
              : "bottom-6 right-6 h-[min(760px,calc(100vh-3rem))] w-[min(560px,calc(100vw-1.5rem))]"
          }`}
        >
          {/* =========================================================
              HEADER
          ========================================================== */}
          <header
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-200/80
              bg-white/95
              px-5
              py-4
              text-slate-900
              backdrop-blur
              shrink-0
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)]
                  text-sky-300
                  shadow-lg
                "
              >
                <Bot className="h-6 w-6" />
              </div>

              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">
                  AI Assistant
                </div>

                <div className="text-sm text-slate-500">
                  Attendance & Roster Assistant
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <button
                type="button"
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = 0;
                  }
                }}
                className="rounded-xl p-2 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Show history"
                title="History"
                >
                <Clock3 className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowCommandHelp(true)}
                className="rounded-xl p-2 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Open command help"
                title="Commands"
              >
                <ClipboardList className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setPanelExpanded((value) => !value)}
                className="rounded-xl p-2 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={panelExpanded ? "Collapse assistant" : "Expand assistant"}
                title={panelExpanded ? "Collapse" : "Expand"}
              >
                {panelExpanded ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close AI Assistant"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* =========================================================
              CHAT AREA
          ========================================================== */}
          <div
            ref={scrollRef}
            className="
              flex-1
              space-y-4
              overflow-y-auto
              bg-[linear-gradient(180deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,1)_18%,rgba(248,250,252,0.8)_100%)]
              p-5
            "
          >
            {messages.map(
              (message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role ===
                    "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[88%]
                      whitespace-pre-wrap
                      rounded-[24px]
                      px-4
                      py-3
                      text-sm
                      leading-6
                      shadow-[0_10px_25px_rgba(15,23,42,0.05)]
                      ${
                        message.role ===
                        "user"
                          ? "bg-[linear-gradient(135deg,#0f1f3c_0%,#173b74_100%)] font-medium text-white"
                          : "border border-slate-200/90 bg-white font-medium text-slate-800"
                      }
                    `}
                  >
                    {message.role === "assistant"
                      ? renderMessageText(message.text)
                      : message.text}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="
                    flex
                    items-center
                    gap-2.5
                    rounded-[24px]
                    border
                    border-slate-200/90
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-slate-600
                    shadow-[0_10px_25px_rgba(15,23,42,0.05)]
                  "
                >
                  <Loader2
                    className="
                      h-4
                      w-4
                      animate-spin
                      text-sky-600
                    "
                  />

                  <span className="font-medium text-slate-700">
                    Working
                  </span>

                  <span className="flex items-center gap-1 text-sky-600">
                    <span className="animate-bounce [animation-delay:-0.2s]">.</span>
                    <span className="animate-bounce [animation-delay:-0.1s]">.</span>
                    <span className="animate-bounce">.</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {showCommandHelp ? (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
              <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-sky-600" />
                      <span className="text-sm font-semibold text-slate-900">Supported Commands</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Copy a command and paste it into the assistant. The copied text contains only the command, not the notes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCommandHelp(false)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close command help"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-4">
                  <div className="grid gap-3">
                    {assistantCommandHelp.map((item) => {
                      const isCopied = copiedCommand === item.command;
                      return (
                        <div
                          key={item.command}
                          className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900">
                                {item.command}
                              </div>
                              <div className="mt-1 text-xs leading-relaxed text-slate-500">
                                {item.note}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyAssistantCommand(item.command)}
                              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* =========================================================
              ATTENDANCE EDITOR
          ========================================================== */}
          {showAttendanceEditor ? (
            <footer
              className="
                border-t
                border-slate-200
                bg-white
                p-3
                shrink-0
              "
            >
              {/* Editor heading */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck
                      className="h-4 w-4 text-sky-600"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      Update Attendance
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Enter employee, status and time when required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeAttendanceEditor
                  }
                  disabled={loading}
                  className="
                    rounded-lg
                    p-1.5
                    text-slate-400
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!reviewMode ? (
                <>
                  {/* Table header */}
                  <div
                    className="
                      grid
                      grid-cols-[1fr_80px_110px_28px]
                      gap-2
                      px-1
                      mb-1
                    "
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Employee
                    </span>

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </span>

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Arrival
                    </span>

                    <span />
                  </div>

                  {/* Attendance rows */}
                  <div className="max-h-[230px] space-y-2 overflow-y-auto pr-1">
                    {attendanceRows.map(
                      (row) => {
                        const requiresTime =
                          statusRequiresTime(
                            row.status
                          );

                        return (
                          <div
                            key={row.id}
                            className="
                              grid
                              grid-cols-[1fr_80px_110px_28px]
                              items-center
                              gap-2
                            "
                          >
                            {/* Employee */}
                            <input
                              ref={(element) => {
                                employeeRefs.current[
                                  row.id
                                ] = element;
                              }}
                              value={
                                row.employeeName
                              }
                              onChange={(
                                event
                              ) =>
                                handleEmployeeChange(
                                  row.id,
                                  event.target
                                    .value
                                )
                              }
                              onKeyDown={(
                                event
                              ) =>
                                handleEmployeeKeyDown(
                                  event,
                                  row.id
                                )
                              }
                              placeholder="Employee"
                              className="
                                h-9
                                min-w-0
                                rounded-lg
                                border
                                border-slate-200
                                bg-slate-50
                                px-2.5
                                text-xs
                                text-slate-800
                                outline-none
                                focus:border-sky-500
                                focus:bg-white
                                focus:ring-2
                                focus:ring-sky-100
                              "
                            />

                            {/* Status */}
                            <input
                              ref={(element) => {
                                statusRefs.current[
                                  row.id
                                ] = element;
                              }}
                              value={
                                row.status
                              }
                              onChange={(
                                event
                              ) =>
                                handleStatusChange(
                                  row.id,
                                  event.target
                                    .value
                                )
                              }
                              onKeyDown={(
                                event
                              ) =>
                                handleStatusKeyDown(
                                  event,
                                  row
                                )
                              }
                              placeholder="P / WO"
                              list="attendance-status-list"
                              className="
                                h-9
                                min-w-0
                                rounded-lg
                                border
                                border-slate-200
                                bg-slate-50
                                px-2
                                text-xs
                                font-medium
                                uppercase
                                text-slate-800
                                outline-none
                                focus:border-sky-500
                                focus:bg-white
                                focus:ring-2
                                focus:ring-sky-100
                              "
                            />

                            {/* Arrival time */}
                            {requiresTime ? (
                              <input
                                ref={(element) => {
                                  timeRefs.current[
                                    row.id
                                  ] = element;
                                }}
                                value={
                                  row.arrivalTime
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateAttendanceRow(
                                    row.id,
                                    "arrivalTime",
                                    event.target
                                      .value
                                  )
                                }
                                onKeyDown={(
                                  event
                                ) =>
                                  handleTimeKeyDown(
                                    event,
                                    row
                                  )
                                }
                                placeholder="6:05 PM"
                                className="
                                  h-9
                                  min-w-0
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-slate-50
                                  px-2.5
                                  text-xs
                                  text-slate-800
                                  outline-none
                                  focus:border-sky-500
                                  focus:bg-white
                                  focus:ring-2
                                  focus:ring-sky-100
                                "
                              />
                            ) : (
                              <div
                                className="
                                  h-9
                                  rounded-lg
                                  bg-slate-50
                                  px-2.5
                                  flex
                                  items-center
                                  text-[10px]
                                  text-slate-300
                                "
                              >
                                —
                              </div>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                removeAttendanceRow(
                                  row.id
                                )
                              }
                              disabled={
                                attendanceRows.length ===
                                  1 ||
                                loading
                              }
                              className="
                                flex
                                h-8
                                w-7
                                items-center
                                justify-center
                                rounded-lg
                                text-slate-400
                                hover:bg-red-50
                                hover:text-red-500
                                disabled:cursor-not-allowed
                                disabled:opacity-30
                              "
                              title="Remove employee"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Status datalist */}
                  <datalist id="attendance-status-list">
                    {attendanceStatusOptions.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        />
                      )
                    )}
                  </datalist>

                  {/* Add employee */}
                  <button
                    type="button"
                    onClick={
                      addAttendanceRow
                    }
                    disabled={loading}
                    className="
                      mt-2
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-1.5
                      rounded-lg
                      border
                      border-dashed
                      border-slate-300
                      py-2
                      text-[11px]
                      font-medium
                      text-slate-500
                      transition
                      hover:border-sky-400
                      hover:bg-sky-50
                      hover:text-sky-600
                    "
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Employee
                  </button>

                  {/* Help */}
                  <div
                    className="
                      mt-2
                      rounded-lg
                      bg-slate-50
                      px-3
                      py-2
                      text-[10px]
                      leading-relaxed
                      text-slate-500
                    "
                  >
                    <strong className="text-slate-700">
                      Tip:
                    </strong>{" "}
                    Enter the employee name, then
                    status. Arrival time appears
                    automatically for{" "}
                    <strong>P</strong>.
                    <br />
                    Example:{" "}
                    <strong>
                      Rahul → P → 6:05 PM
                    </strong>
                  </div>

                  {/* Editor actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={
                        closeAttendanceEditor
                      }
                      disabled={loading}
                      className="
                        flex-1
                        rounded-lg
                        border
                        border-slate-200
                        py-2.5
                        text-xs
                        font-medium
                        text-slate-600
                        hover:bg-slate-50
                      "
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        reviewAttendance
                      }
                      disabled={loading}
                      className="
                        flex-1
                        rounded-lg
                        bg-slate-900
                        py-2.5
                        text-xs
                        font-medium
                        text-white
                        hover:bg-sky-600
                        disabled:opacity-50
                      "
                    >
                      Review Changes
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* =================================================
                      REVIEW MODE
                  ================================================== */}
                  <div
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      p-3
                    "
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-sky-600" />

                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          Review Changes
                        </div>

                        <div className="text-[10px] text-slate-400">
                          Check everything before updating.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {attendanceRows
                        .filter((row) => safeText(row.employeeName))
                        .map((row) => (
                          <div
                            key={row.id}
                            className="
                              flex
                              items-center
                              justify-between
                              rounded-lg
                              border
                              border-slate-200
                              bg-white
                              px-3
                              py-2.5
                            "
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-800">
                                {row.employeeName}
                              </div>

                              <div className="mt-0.5 text-[10px] text-slate-400">
                                Status:{" "}
                                <span className="font-semibold text-slate-600">
                                  {normalizeStatus(
                                    row.status
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              {statusRequiresTime(
                                row.status
                              ) ? (
                                <div className="text-xs font-semibold text-sky-600">
                                  {row.arrivalTime}
                                </div>
                              ) : (
                                <div className="text-xs text-slate-300">
                                  No time
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Confirmation warning */}
                  <div
                    className="
                      mt-3
                      rounded-lg
                      border
                      border-amber-200
                      bg-amber-50
                      px-3
                      py-2
                      text-[10px]
                      leading-relaxed
                      text-amber-700
                    "
                  >
                    These changes will be sent to
                    the backend for authorization
                    and attendance validation.
                  </div>

                  {/* Review actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setReviewMode(
                          false
                        )
                      }
                      disabled={loading}
                      className="
                        flex
                        flex-1
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        border
                        border-slate-200
                        py-2.5
                        text-xs
                        font-medium
                        text-slate-600
                        hover:bg-slate-50
                      "
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={
                        confirmAttendanceUpdate
                      }
                      disabled={loading}
                      className="
                        flex
                        flex-1
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        bg-slate-900
                        py-2.5
                        text-xs
                        font-medium
                        text-white
                        hover:bg-sky-600
                        disabled:opacity-50
                      "
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Confirm & Update
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </footer>
          ) : showRosterReuseForm ? (
            <footer
              className="
                space-y-3
                border-t
                border-slate-200
                bg-white
                p-3
                shrink-0
              "
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-sky-600" />
                    <span className="text-sm font-semibold text-slate-800">
                      Reuse Roster
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Select the source week and the target week. The assistant will preview the roster after you submit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRosterReuseForm}
                  disabled={loading}
                  className="
                    rounded-lg
                    p-1.5
                    text-slate-400
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                  aria-label="Cancel roster reuse form"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Source Week
                  </div>

                  <div className="mt-3 grid gap-3">
                    <label className="grid gap-1 text-[10px] font-medium text-slate-500">
                      Start Date
                      <input
                        type="date"
                        value={rosterReuseForm.sourceStartDate}
                        onChange={(event) =>
                          updateRosterReuseForm("sourceStartDate", event.target.value)
                        }
                        disabled={loading}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>

                    <label className="grid gap-1 text-[10px] font-medium text-slate-500">
                      End Date
                      <input
                        type="date"
                        value={rosterReuseForm.sourceEndDate}
                        onChange={(event) =>
                          updateRosterReuseForm("sourceEndDate", event.target.value)
                        }
                        disabled={loading}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Target Week
                  </div>

                  <div className="mt-3 grid gap-3">
                    <label className="grid gap-1 text-[10px] font-medium text-slate-500">
                      Start Date
                      <input
                        type="date"
                        value={rosterReuseForm.targetStartDate}
                        onChange={(event) =>
                          updateRosterReuseForm("targetStartDate", event.target.value)
                        }
                        disabled={loading}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>

                    <label className="grid gap-1 text-[10px] font-medium text-slate-500">
                      End Date
                      <input
                        type="date"
                        value={rosterReuseForm.targetEndDate}
                        onChange={(event) =>
                          updateRosterReuseForm("targetEndDate", event.target.value)
                        }
                        disabled={loading}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-[10px] leading-relaxed text-sky-700">
                Example: source 2026-08-03 to 2026-08-09, target 2026-08-10 to 2026-08-16.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeRosterReuseForm}
                  disabled={loading}
                  className="
                    flex-1
                    rounded-lg
                    border
                    border-slate-200
                    py-2.5
                    text-xs
                    font-medium
                    text-slate-600
                    hover:bg-slate-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitRosterReuseForm}
                  disabled={loading}
                  className="
                    flex-1
                    rounded-lg
                    bg-slate-900
                    py-2.5
                    text-xs
                    font-medium
                    text-white
                    hover:bg-sky-600
                    disabled:opacity-50
                  "
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Previewing...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Preview Roster
                    </>
                  )}
                </button>
              </div>
            </footer>
          ) : rosterReuseDraft ? (
            <footer
              className="
                space-y-3
                border-t
                border-slate-200
                bg-white
                p-3
                shrink-0
              "
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-sky-600" />
                    <span className="text-sm font-semibold text-slate-800">
                      Reuse Roster Preview
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Edit the weekly statuses before confirming reuse.
                  </p>

                  <div className="mt-1 text-[10px] leading-relaxed text-slate-500">
                    Source:{" "}
                    <span className="font-semibold text-slate-700">
                      {rosterReuseDraft.sourceRange}
                    </span>
                    <span className="mx-2 text-slate-300">•</span>
                    Target:{" "}
                    <span className="font-semibold text-slate-700">
                      {rosterReuseDraft.targetRange}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cancelRosterReuse}
                  disabled={loading}
                  className="
                    rounded-lg
                    p-1.5
                    text-slate-400
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                  aria-label="Cancel roster reuse"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
                Use the fields below to update any day before reuse. The edited status values will be saved into the new roster.
              </div>

              <div className="max-h-[42vh] overflow-auto space-y-3 rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_10px_25px_rgba(15,23,42,0.05)]">
                {(rosterReuseDraft.employees || []).map((employee) => (
                  <fieldset
                    key={rosterReuseEmployeeKey(employee)}
                    className="rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-3"
                  >
                    <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {employee.name}
                    </legend>

                    <div className="mb-3 mt-1 text-[10px] leading-relaxed text-slate-400">
                      {[employee.employeeId, employee.teamLeader, employee.department]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>

                    <div className="space-y-2">
                      {(rosterReuseDraft.days || []).map((day) => {
                        const cell =
                          employee.dailyStatus?.find(
                            (entry) =>
                              String(entry.date || "").trim() === day.date
                          ) || {};

                        return (
                          <div
                            key={`${rosterReuseEmployeeKey(employee)}-${day.date}`}
                            className="grid gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-800">
                                {day.label}
                              </div>
                              <div className="mt-0.5 text-[10px] text-slate-400">
                                {day.date}
                              </div>
                            </div>

                            <select
                              value={cell.status || ""}
                              onChange={(event) =>
                                updateRosterReuseCell(
                                  rosterReuseEmployeeKey(employee),
                                  day.date,
                                  event.target.value
                                )
                              }
                              disabled={loading}
                              className="
                                h-9
                                w-full
                                rounded-lg
                                border
                                border-slate-200
                                bg-slate-50
                                px-2
                                text-xs
                                font-medium
                                text-slate-800
                                outline-none
                                focus:border-sky-500
                                focus:bg-white
                                focus:ring-2
                                focus:ring-sky-100
                              "
                            >
                              <option value="">Select status</option>
                              {attendanceStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelRosterReuse}
                  disabled={loading}
                  className="
                    flex-1
                    rounded-lg
                    border
                    border-slate-200
                    py-2.5
                    text-xs
                    font-medium
                    text-slate-600
                    hover:bg-slate-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmRosterReuse}
                  disabled={loading}
                  className="
                    flex-1
                    rounded-lg
                    bg-slate-900
                    py-2.5
                    text-xs
                    font-medium
                    text-white
                    hover:bg-sky-600
                    disabled:opacity-50
                  "
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Reusing...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Confirm & Reuse
                    </>
                  )}
                </button>
              </div>
            </footer>
          ) : (
            /* =========================================================
               NORMAL CHAT FOOTER
            ========================================================== */
            <footer
              className="
                space-y-3
                border-t
                border-slate-200/80
                bg-white
                p-3
                shrink-0
              "
            >
              {/* Quick actions */}
              <div
                className="
                  rounded-[24px]
                  border
                  border-slate-200/80
                  bg-slate-50/80
                  p-3
                "
              >
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Quick Actions
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCommandHelp(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Commands
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {quickActions.map(
                    (action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() =>
                          handleQuickAction(
                            action
                          )
                        }
                        disabled={loading}
                        className="
                          group
                          rounded-2xl
                          border
                          border-slate-200/90
                          bg-white
                          p-3
                          text-left
                          transition
                          hover:border-sky-300
                          hover:bg-sky-50/50
                          hover:shadow-sm
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      >
                        <span
                          className="
                            block
                            text-xs
                            font-semibold
                            text-slate-800
                            group-hover:text-sky-700
                          "
                        >
                          {action.label}
                        </span>

                        <span
                          className="
                            mt-0.5
                            block
                            truncate
                            text-[11px]
                            text-slate-400
                            group-hover:text-sky-600
                          "
                        >
                          {action.description}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Input */}
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  rows={2}
                  className="
                    min-h-[52px]
                    flex-1
                    resize-none
                    rounded-[22px]
                    border
                    border-slate-200/90
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-slate-900
                    outline-none
                    transition
                    focus:border-sky-500
                    focus:bg-white
                    focus:ring-2
                    focus:ring-sky-100
                    placeholder:text-slate-400
                  "
                  placeholder="Ask about attendance or roster..."
                />

                <button
                  type="button"
                  onClick={
                    sendMessage
                  }
                  disabled={
                    loading ||
                    !input.trim()
                  }
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-[22px]
                    bg-[linear-gradient(135deg,#0f1f3c_0%,#2457d6_100%)]
                    text-white
                    transition
                    hover:bg-sky-600
                    active:scale-95
                    disabled:cursor-not-allowed
                    disabled:bg-slate-200
                    disabled:text-slate-400
                  "
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </footer>
          )}
        </section>
      )}

      {/* ===============================================================
          FLOATING AI BUTTON
      ================================================================ */}
      {!open && (
        <button
          type="button"
          title="AI Assistant"
          aria-label="AI Assistant"
          onClick={() =>
            setOpen(true)
          }
          className="
            fixed
            bottom-5
            right-5
            z-[9999]
            flex
            h-13
            w-13
            items-center
            justify-center
            rounded-full
            bg-slate-900
            text-white
            shadow-xl
            transition-all
            duration-200
            hover:scale-105
            hover:bg-sky-600
            focus:outline-none
            focus:ring-4
            focus:ring-sky-200
            active:scale-95
          "
        >
          <Bot className="h-6 w-6" />
        </button>
      )}
    </>
  );
};

export default AiAssistantWidget;
