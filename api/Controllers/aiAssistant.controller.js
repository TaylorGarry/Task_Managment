import {
  appendAiMessage,
  assertConversationOwner,
  getOrCreateConversation,
  getRecentAiMessages,
} from "../services/aiConversation.service.js";
import { handleAgentMessage } from "../services/aiAgent.service.js";
import { AI_FRIENDLY_UNAVAILABLE_MESSAGE, AiProviderError } from "../services/aiProvider.service.js";
import {
  getAttendanceStatuses,
  getPendingActionForUser,
} from "../services/aiAssistantTools.service.js";
import { getRoleType, normalizeDepartment } from "../utils/roleAccess.js";

const labelOfUser = (user = {}) => user.realName || user.pseudoName || user.username || user.name || "";

export const handleAiAssistantMessage = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const conversation = req.body?.conversationId
      ? await assertConversationOwner({ conversationId: req.body.conversationId, userId: req.user._id })
      : await getOrCreateConversation(req.user._id);

    await appendAiMessage({
      conversation,
      owner: req.user._id,
      role: "user",
      text: message,
    });

    const recentMessages = await getRecentAiMessages({
      conversation,
      owner: req.user._id,
      limit: 16,
    });

    const result = await handleAgentMessage({ req, conversation: recentMessages });
    const reply = result.reply || result.message || "I could not process that request.";

    await appendAiMessage({
      conversation,
      owner: req.user._id,
      role: "assistant",
      text: reply,
      toolName: result.toolCall?.tool || result.type || "",
      payload: {
        type: result.type,
        pendingActionId: result.pendingActionId || null,
        preview: result.preview || null,
      },
    });

    return res.json({
      success: true,
      conversationId: conversation._id,
      pendingActionId: result.pendingActionId || null,
      type: result.type || null,
      action: result.action || null,
      preview: result.preview || null,
      reply,
    });
  } catch (error) {
    const status = error instanceof AiProviderError && Number(error.status) === 429 ? 429 : 500;
    const safeMessage =
      error instanceof AiProviderError && error.safeMessage
        ? error.safeMessage
        : status === 429
          ? AI_FRIENDLY_UNAVAILABLE_MESSAGE
          : "AI Assistant is unavailable right now. Please try again later.";

    console.error("AI assistant error:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack,
    });

    return res.status(status).json({
      success: false,
      message: safeMessage,
    });
  }
};

export const getAiAssistantState = async (req, res) => {
  try {
    const conversation = await getOrCreateConversation(req.user._id);
    const messages = await getRecentAiMessages({
      conversation,
      owner: req.user._id,
      limit: 30,
    });
    const pending = await getPendingActionForUser(req.user._id);

    return res.json({
      success: true,
      conversationId: conversation._id,
      attendanceStatuses: (await getAttendanceStatuses()).statuses || [],
      messages: messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({ role: message.role, text: message.text, createdAt: message.createdAt })),
      pendingAction: pending
        ? {
            id: pending._id,
            action: pending.action,
            preview: pending.preview,
            affectedTeamLeaders: pending.affectedTeamLeaders,
            expiresAt: pending.expiresAt,
          }
        : null,
      user: {
        id: req.user._id,
        name: labelOfUser(req.user),
        roleType: getRoleType(req.user),
        department: normalizeDepartment(req.user.department),
      },
    });
  } catch (error) {
    console.error("AI assistant state error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load AI Assistant state.",
    });
  }
};
