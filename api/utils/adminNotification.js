import User from "../Modals/User.modal.js";
import Notification from "../Modals/Notification.modal.js";
import { isHrDepartment } from "./roleAccess.js";

const resolveName = (user = {}) =>
  String(user.realName || user.username || "Unknown").trim();

export const notifySuperAdminsForHrAction = async ({
  actor = null,
  action = "",
  target = null,
  io = null,
} = {}) => {
  if (!actor || !isHrDepartment(actor) || !target || !action) return;

  const superAdmins = await User.find({
    accountType: "superAdmin",
    isActive: { $ne: false },
  })
    .select("_id")
    .lean();

  if (!superAdmins.length) return;

  const actorName = resolveName(actor);
  const targetName = resolveName(target);
  const targetId = String(target._id || "");
  const targetAccountType = String(target.accountType || "");

  const configMap = {
    user_created: {
      title: "HR created a user",
      message: `HR ${actorName} created ${targetName}.`,
    },
    user_deleted: {
      title: "HR deleted a user",
      message: `HR ${actorName} deleted ${targetName}.`,
    },
    user_inactivated: {
      title: "HR inactivated a user",
      message: `HR ${actorName} inactivated ${targetName}.`,
    },
  };

  const selected = configMap[action];
  if (!selected) return;

  const now = new Date();
  const docs = superAdmins.map((sa) => ({
    recipient: sa._id,
    actor: actor._id || null,
    type: action,
    title: selected.title,
    message: selected.message,
    metadata: {
      actorId: actor._id || null,
      actorUsername: actor.username || "",
      targetId,
      targetUsername: target.username || "",
      targetName,
      targetAccountType,
    },
    createdAt: now,
    updatedAt: now,
  }));

  const created = await Notification.insertMany(docs);

  if (io) {
    created.forEach((notification) => {
      io.to(String(notification.recipient)).emit("system_notification", notification);
    });
  }
};
