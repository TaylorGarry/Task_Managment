import AiConversation from "../Modals/AiConversation.modal.js";
import AiMessage from "../Modals/AiMessage.modal.js";

export const getOrCreateConversation = async (userId) => {
  const now = new Date();
  let conversation = await AiConversation.findOne({
    owner: userId,
    status: "active",
    expiresAt: { $gt: now },
  }).sort({ lastMessageAt: -1 });
  if (!conversation) {
    conversation = await AiConversation.create({
      owner: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }
  return conversation;
};

export const assertConversationOwner = async ({ conversationId, userId }) => {
  const conversation = await AiConversation.findOne({
    _id: conversationId,
    owner: userId,
    status: "active",
    expiresAt: { $gt: new Date() },
  });
  if (!conversation) throw new Error("Conversation not found.");
  return conversation;
};

export const appendAiMessage = async ({ conversation, owner, role, text = "", toolName = "", payload = null }) => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const message = await AiMessage.create({
    conversation: conversation._id,
    owner,
    role,
    text,
    toolName,
    payload,
    expiresAt,
  });
  conversation.lastMessageAt = new Date();
  conversation.expiresAt = expiresAt;
  await conversation.save();
  return message;
};

export const getRecentAiMessages = async ({ conversation, owner, limit = 20 }) => {
  const messages = await AiMessage.find({ conversation: conversation._id, owner })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return messages.reverse().map((message) => ({
    role: message.role,
    text: message.text,
    toolName: message.toolName,
    payload: message.payload,
    createdAt: message.createdAt,
  }));
};
