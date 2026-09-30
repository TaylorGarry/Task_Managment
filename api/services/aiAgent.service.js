import { generateResponse, generateToolCall } from "./aiProvider.service.js";
import {
  bulkUpdateAttendance,
  cancelPendingAction,
  completePendingAttendanceTime,
  confirmPendingAction,
  getAttendance,
  getAttendanceStatuses,
  getEmployeeAttendance,
  getMyAttendance,
  getPendingActionForUser,
  getPreviousRoster,
  getTeamAttendanceTool,
  previewAttendanceUpdate,
  previewTeamAttendanceUpdate,
  previewRosterReuse,
  reuseRoster,
} from "./aiAssistantTools.service.js";
import { getAllowedAttendanceStatuses } from "./attendanceStatus.service.js";

const CONFIRM_WORDS = new Set(["yes", "confirm", "approved","ok", "approve", "go ahead", "do it", "proceed"]);
const CANCEL_WORDS = new Set(["cancel", "abort", "stop","no", "don't do it", "do not do it", "never mind", "nevermind"]);
const HELP_WORDS = new Set(["help", "commands", "command", "menu", "hi","what can you do", "what can i ask"]);

const normalize = (value = "") => String(value || "").trim().toLowerCase();
const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const capabilityMessage = [
  "I can help with attendance and roster commands.",
  "",
  "Examples:",
  "- show my attendance today",
  "- show shruti attendance today",
  "- show Rahul attendance this month",
  "- show my team attendance this week",
  "- mark Rahul WO today",
  "- mark Rahul P today at 09:30",
  "- update my team attendance today",
  "- reuse last week's roster for next week",
  "",
  "For P status, I will ask for arrival time if you do not provide it.",
].join("\n");

const TOOL_SYSTEM_PROMPT = `
You are an intent parser for a CRM AI assistant. Return only valid JSON.
Do not decide authorization. Do not invent user IDs, roles, employee IDs, or database fields.
Select exactly one tool and provide arguments extracted from the user's natural language.

Available tools:
- getMyAttendance: view the authenticated user's own attendance. Args: { date?, startDate?, endDate?, dateText? }
- getEmployeeAttendance: view one employee's attendance. Args: { employeeName, date?, startDate?, endDate?, dateText? }
- getTeamAttendance: view the authenticated user's team attendance. Args: { date?, startDate?, endDate?, dateText? }
- previewAttendanceUpdate: preview a destructive attendance update. Args: { date?, dateText?, employees: [{ employeeName, status, arrivalTime?, date?, dateText? }] }
- previewTeamAttendanceUpdate: preview a team-only attendance update for the authenticated supervisor. Args: { date?, dateText?, arrivalTime? }
- bulkUpdateAttendance: confirm and execute a pending attendance update. Args: { }
- confirmPendingAction: confirm the authenticated user's pending AI action. Args: { }
- cancelPendingAction: cancel the authenticated user's pending AI action. Args: { }
- getAttendanceStatuses: list valid CRM attendance statuses. Args: { }
- getPreviousRoster: inspect source/target roster context before reuse. Args: { sourceStartDate?, sourceEndDate?, targetStartDate?, targetEndDate?, dateText? }
- previewRosterReuse: preview a destructive roster reuse action. Args: { sourceStartDate?, sourceEndDate?, targetStartDate?, targetEndDate?, dateText? }
- reuseRoster: confirm and execute a pending roster reuse action. Args: { }
- clarify: ask a short clarification question. Args: { question }

Rules:
- If the user asks about "my attendance" or "my own attendance", use getMyAttendance.
- If the user asks about "my team attendance" or "own team attendance", use getTeamAttendance.
- If the user asks to update "my team attendance", use previewTeamAttendanceUpdate.
- If the user asks about another employee by name, use getEmployeeAttendance.
- Example: "show shruti attendance today" -> getEmployeeAttendance with employeeName "shruti".
- For multiple employee updates, use previewAttendanceUpdate with one employees item per employee.
- Team attendance updates mean department status P for every employee in the authenticated supervisor's team. Ask only for arrival time when it is missing.
- Use the user's exact attendance status token. Do not map statuses.
- If the request is not about attendance or roster, use clarify.
- For roster reuse, do not guess week ranges. Ask for explicit source and target week dates when they are missing.
`;

const RESPONSE_SYSTEM_PROMPT = `
You are the CRM AI assistant. Write concise natural-language responses based only on the backend tool result.
Do not claim an update happened unless the tool result says it was executed.
If confirmation is required, preserve the preview details and ask for confirmation.
If authorization or validation failed, say that no changes were made.
`;

const normalizeToolCall = (toolCall = {}) => {
  const tool = String(toolCall?.tool || "").trim();
  const args = toolCall?.args && typeof toolCall.args === "object" ? toolCall.args : {};
  return { tool, args };
};

const isPendingConfirm = (message = "") => CONFIRM_WORDS.has(normalize(message));
const isPendingCancel = (message = "") => CANCEL_WORDS.has(normalize(message));
const isPendingHelp = (message = "") => HELP_WORDS.has(normalize(message));

const isAttendanceViewMessage = (message = "") =>
  /\b(?:show|view|see|check|get|tell)\b/i.test(String(message || "")) &&
  /\b(?:attendance|status)\b/i.test(String(message || "")) &&
  !/\b(?:mark|set|update|change)\b/i.test(String(message || ""));

const hasAttendanceStatusToken = (message = "") => {
  const normalizedMessage = ` ${normalize(message).replace(/[()\-_/.,:]+/g, " ").replace(/\s+/g, " ")} `;
  return getAllowedAttendanceStatuses().some((status) => {
    const normalizedStatus = ` ${normalize(status).replace(/[()\-_/.,:]+/g, " ").replace(/\s+/g, " ")} `;
    return normalizedStatus.trim() && normalizedMessage.includes(normalizedStatus);
  });
};

const inferArrivalTimeFromMessage = (message = "") => {
  const raw = String(message || "")
    .trim()
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+(am|pm)\b/gi, " $1")
    .replace(/\s+/g, " ");
  if (!raw) return "";

  const h24Period = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(am|pm)\b/i);
  if (h24Period) {
    let hour = Number(h24Period[1]);
    const minute = Number(h24Period[2]);
    const period = String(h24Period[3]).toLowerCase();
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const h24 = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (h24) return `${h24[1].padStart(2, "0")}:${h24[2]}`;

  const clock12 = raw.match(/\b(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (!clock12) return "";

  let hour = Number(clock12[1]);
  const minute = Number(clock12[2] || "0");
  const period = String(clock12[3] || "").toLowerCase();
  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const inferStatusFromMessage = (message = "") => {
  const normalizedMessage = normalize(message);
  const statuses = getAllowedAttendanceStatuses()
    .filter(Boolean)
    .sort((a, b) => String(b).length - String(a).length);

  for (const status of statuses) {
    const normalizedStatus = normalize(status);
    if (!normalizedStatus) continue;
    const statusPattern = new RegExp(`(?:^|\\s)${escapeRegExp(normalizedStatus)}(?:\\s|$)`, "i");
    if (statusPattern.test(normalizedMessage)) return status;
  }

  return "";
};

const inferEmployeeNamesFromMessage = (message = "") => {
  const original = String(message || "").trim();
  if (!original) return [];

  const statusList = getAllowedAttendanceStatuses()
    .filter(Boolean)
    .map(escapeRegExp)
    .sort((a, b) => b.length - a.length);
  const statusPattern = statusList.length ? statusList.join("|") : "$^";

  const stripped = original
    .replace(new RegExp(`\\b(?:mark|set|update|change|attendance|status|employee|employees|please|today|tomorrow|yesterday|this|next|last|week|month|from|to|for|on|at|of)\\b`, "gi"), " ")
    .replace(new RegExp(`\\b(?:${statusPattern})\\b`, "gi"), " ")
    .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\s*(am|pm)?\b/gi, " ")
    .replace(/\b(1[0-2]|0?[1-9])\s*(am|pm)\b/gi, " ")
    .replace(/[,:;]+/g, " ");

  return stripped
    .split(/\s*(?:,|;|&|\band\b)\s*/i)
    .map((name) => name.replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const isAttendanceUpdateMessage = (message = "") => {
  const text = String(message || "");
  if (!text.trim()) return false;
  if (/\b(?:mark|set|update|change)\b/i.test(text)) return true;
  if (/\bstatus\b/i.test(text) && hasAttendanceStatusToken(text)) return true;
  return hasAttendanceStatusToken(text) && Boolean(inferArrivalTimeFromMessage(text));
};

const isRosterReuseMessage = (message = "") => {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return false;
  if (/\breuse\b/.test(text) && /\broster\b/.test(text)) return true;
  if (/\breuse\b/.test(text) && /\blast week(?:'s)?\b/.test(text)) return true;
  return false;
};

const inferRosterReuseFallback = (message = "") => {
  const original = String(message || "").trim();
  if (!original || !isRosterReuseMessage(original)) return null;

  const datePattern = /\b\d{4}-\d{2}-\d{2}\b/g;
  const dates = original.match(datePattern) || [];
  if (dates.length >= 4) {
    return {
      tool: "previewRosterReuse",
      args: {
        sourceStartDate: dates[0],
        sourceEndDate: dates[1],
        targetStartDate: dates[2],
        targetEndDate: dates[3],
        dateText: original,
      },
    };
  }

  return {
    tool: "clarify",
    args: {
      question:
        "Please share the source week and target week dates in YYYY-MM-DD format. Example: source 2026-08-03 to 2026-08-09, target 2026-08-10 to 2026-08-16.",
    },
  };
};

const inferAttendanceViewFallback = (message = "") => {
  const original = String(message || "").trim();
  const normalized = normalize(original);
  if (!normalized || !isAttendanceViewMessage(original)) return null;

  if (/\b(?:my|mine|own|my own)\s+(?:attendance|status)\b/i.test(original)) {
    return { tool: "getMyAttendance", args: { dateText: original } };
  }

  if (/\b(?:my|own)\s+team\s+(?:attendance|status)\b/i.test(original)) {
    return { tool: "getTeamAttendance", args: { dateText: original } };
  }

  const employeeMatch = original.match(
    /\b(?:show|view|see|check|get|tell)\b\s+(?:the\s+)?(?:attendance|status\s+(?:of|for)\s+)?(.+?)\s+\b(?:attendance|status)\b/i
  );
  const employeeName = employeeMatch?.[1]
    ? employeeMatch[1]
        .replace(/\b(?:my|own|team|the)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  if (!employeeName) return null;
  return {
    tool: "getEmployeeAttendance",
    args: {
      employeeName,
      dateText: original,
    },
  };
};

const inferAttendanceUpdateFallback = (message = "") => {
  const original = String(message || "").trim();
  if (!original || !isAttendanceUpdateMessage(original)) return null;

  const employeeNames = inferEmployeeNamesFromMessage(original);
  const status = inferStatusFromMessage(original);
  const arrivalTime = inferArrivalTimeFromMessage(original);
  if (!employeeNames.length || !status) return null;

  return {
    tool: "previewAttendanceUpdate",
    args: {
      dateText: original,
      employees: employeeNames.map((employeeName) => ({
        employeeName,
        status,
        ...(arrivalTime ? { arrivalTime } : {}),
        dateText: original,
      })),
    },
  };
};

const isTeamAttendanceUpdateMessage = (message = "") => {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return false;
  if (!text.includes("team attendance")) return false;
  return /\b(?:update|mark|set|change)\b/.test(text);
};

const inferTeamAttendanceUpdateFallback = (message = "") => {
  const original = String(message || "").trim();
  if (!original || !isTeamAttendanceUpdateMessage(original)) return null;

  return {
    tool: "previewTeamAttendanceUpdate",
    args: {
      dateText: original,
      originalMessage: original,
      arrivalTime: inferArrivalTimeFromMessage(original),
    },
  };
};

const shouldRecoverAttendanceClarification = (message = "", toolCall = {}) => {
  if (!isAttendanceViewMessage(message)) return false;
  const tool = String(toolCall?.tool || "").trim();
  if (!tool) return true;
  if (tool === "clarify") return true;
  return !isValidToolName(tool);
};

const shouldRecoverTeamAttendanceUpdate = (message = "", toolCall = {}) => {
  if (!isTeamAttendanceUpdateMessage(message)) return false;
  const tool = String(toolCall?.tool || "").trim();
  if (tool === "previewTeamAttendanceUpdate") return false;
  if (!tool) return true;
  if (tool === "clarify") return true;
  return true;
};

const shouldRecoverAttendanceUpdate = (message = "", toolCall = {}) => {
  if (!isAttendanceUpdateMessage(message)) return false;
  const tool = String(toolCall?.tool || "").trim();
  if (!tool) return true;
  if (tool === "clarify") return true;
  return !isValidToolName(tool);
};

const TOOL_MAP = {
  getAttendance,
  getMyAttendance,
  getEmployeeAttendance,
  getTeamAttendance: getTeamAttendanceTool,
  previewAttendanceUpdate,
  previewTeamAttendanceUpdate,
  bulkUpdateAttendance,
  confirmPendingAction,
  cancelPendingAction,
  getAttendanceStatuses,
  getPreviousRoster,
  previewRosterReuse,
  reuseRoster,
  clarify: async ({ args }) => ({ type: "clarification", message: args.question || capabilityMessage }),
};

const runSelectedTool = async ({ req, toolCall }) => {
  const { tool, args } = normalizeToolCall(toolCall);
  const runner = TOOL_MAP[tool];
  if (!runner) {
    return { type: "clarification", message: capabilityMessage };
  }

  const enrichedArgs = {
    ...args,
    originalMessage: req.body?.message || "",
    dateText: args.dateText || req.body?.message || "",
  };

  switch (tool) {
    case "getAttendance":
    case "getMyAttendance":
    case "getEmployeeAttendance":
    case "getTeamAttendance":
    case "previewAttendanceUpdate":
    case "previewTeamAttendanceUpdate":
    case "getPreviousRoster":
    case "previewRosterReuse":
      return runner({ actor: req.user, args: enrichedArgs });
    case "bulkUpdateAttendance":
    case "confirmPendingAction":
    case "reuseRoster":
      return runner({ req });
    case "cancelPendingAction":
      return runner({ actor: req.user });
    case "getAttendanceStatuses":
      return runner({ actor: req.user, args: enrichedArgs });
    case "clarify":
      return runner({ args: enrichedArgs });
    default:
      return { type: "clarification", message: capabilityMessage };
  }
};

const isValidToolName = (tool = "") => Object.prototype.hasOwnProperty.call(TOOL_MAP, tool);

const normalizeModelToolCall = (toolCall = {}, message = "") => {
  const normalized = normalizeToolCall(toolCall);
  if (isRosterReuseMessage(message)) {
    return inferRosterReuseFallback(message) || normalized;
  }
  if (shouldRecoverTeamAttendanceUpdate(message, normalized)) {
    return inferTeamAttendanceUpdateFallback(message) || normalized;
  }
  if (shouldRecoverAttendanceUpdate(message, normalized)) {
    return inferAttendanceUpdateFallback(message) || normalized;
  }
  if (shouldRecoverAttendanceClarification(message, normalized)) {
    return inferAttendanceViewFallback(message) || normalized;
  }
  if (!normalized.tool) {
    return inferRosterReuseFallback(message) || inferAttendanceUpdateFallback(message) || inferAttendanceViewFallback(message) || { tool: "clarify", args: { question: "I need a clearer request." } };
  }
  if (!isValidToolName(normalized.tool)) {
    return inferRosterReuseFallback(message) || inferAttendanceUpdateFallback(message) || inferAttendanceViewFallback(message) || { tool: "clarify", args: { question: capabilityMessage } };
  }
  return normalized;
};

export const handleAgentMessage = async ({ req, conversation }) => {
  const message = String(req.body?.message || "").trim();
  const lower = normalize(message);

  if (isPendingCancel(lower)) {
    return cancelPendingAction({ actor: req.user });
  }
  if (isPendingHelp(lower)) {
    return { type: "help", message: capabilityMessage };
  }

  const completedTimeRequest = await completePendingAttendanceTime({ actor: req.user, message });
  if (completedTimeRequest) {
    return completedTimeRequest;
  }

  if (isPendingConfirm(lower)) {
    return confirmPendingAction({ req });
  }

  let toolCall = await generateToolCall({
    systemPrompt: TOOL_SYSTEM_PROMPT,
    userMessage: message,
    context: {
      today: new Date().toISOString(),
      timezone: "Asia/Kolkata",
      allowedAttendanceStatuses: getAllowedAttendanceStatuses(),
      authenticatedUser: {
        id: String(req.user?._id || ""),
        username: req.user?.username,
        name: req.user?.realName || req.user?.pseudoName || req.user?.username,
        accountType: req.user?.accountType,
        roleType: req.user?.roleType,
      },
    },
    conversation,
  });

  toolCall = normalizeModelToolCall(toolCall, message);

  const toolResult = await runSelectedTool({ req, toolCall });
  let reply = toolResult.message || "";

  if (!reply) {
    reply = await generateResponse({
      systemPrompt: RESPONSE_SYSTEM_PROMPT,
      toolResult,
      conversation,
      context: {
        authenticatedUser: {
          id: String(req.user?._id || ""),
          username: req.user?.username,
          accountType: req.user?.accountType,
          roleType: req.user?.roleType,
        },
      },
    });
  }

  return {
    ...toolResult,
    toolCall,
    reply,
  };
};

export { getPendingActionForUser };
