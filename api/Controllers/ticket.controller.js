import mongoose from "mongoose";
import Ticket from "../Modals/Ticket.modal.js";
import { getRoleType, normalizeDepartment } from "../utils/roleAccess.js";

const TICKET_STATUSES = ["Pending", "Approved", "Rejected"];

const isItUser = (user = {}) => normalizeDepartment(user?.department) === "IT";

const formatTicket = (ticket) => {
  const obj = typeof ticket?.toObject === "function" ? ticket.toObject() : ticket;
  return {
    ...obj,
    creatorRole: obj?.createdBy ? getRoleType(obj.createdBy) : "",
    creatorDepartment: obj?.createdBy ? normalizeDepartment(obj.createdBy.department) : "",
  };
}; 

const populateTicket = (query) =>
  query
    .populate("createdBy", "username realName pseudoName empId accountType isTeamLeader department designation")
    .populate("statusUpdatedBy", "username realName pseudoName empId accountType isTeamLeader department designation")
    .populate("reRaisedFrom", "title status createdAt closedAt");

export const createTicket = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const reRaisedFrom = String(req.body?.reRaisedFrom || "").trim();

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    if (reRaisedFrom) {
      if (!mongoose.Types.ObjectId.isValid(reRaisedFrom)) {
        return res.status(400).json({ success: false, message: "Invalid source ticket" });
      }

      const sourceTicket = await Ticket.findById(reRaisedFrom).select("createdBy");
      if (!sourceTicket) {
        return res.status(404).json({ success: false, message: "Source ticket not found" });
      }

      const ownsSource = String(sourceTicket.createdBy) === String(req.user._id);
      if (!ownsSource && !isItUser(req.user)) {
        return res.status(403).json({ success: false, message: "You can re-raise only your own ticket" });
      }
    }

    const ticket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id,
      reRaisedFrom: reRaisedFrom || null,
    });

    const populated = await populateTicket(Ticket.findById(ticket._id));
    return res.status(201).json({
      success: true,
      message: reRaisedFrom ? "Ticket re-raised successfully" : "Ticket created successfully",
      ticket: formatTicket(populated),
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return res.status(500).json({ success: false, message: "Failed to create ticket" });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await populateTicket(
      Ticket.find({ createdBy: req.user._id }).sort({ createdAt: -1 })
    );
    return res.json({ success: true, tickets: tickets.map(formatTicket) });
  } catch (error) {
    console.error("Get my tickets error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tickets" });
  }
};

export const getAllTicketsForIT = async (req, res) => {
  try {
    if (!isItUser(req.user)) {
      return res.status(403).json({ success: false, message: "Only IT users can view all tickets" });
    }

    const tickets = await populateTicket(Ticket.find({}).sort({ createdAt: -1 }));
    return res.json({ success: true, tickets: tickets.map(formatTicket) });
  } catch (error) {
    console.error("Get IT tickets error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch IT tickets" });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    if (!isItUser(req.user)) {
      return res.status(403).json({ success: false, message: "Only IT users can update ticket status" });
    }

    const { id } = req.params;
    const status = String(req.body?.status || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ticket id" });
    }

    if (!TICKET_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid ticket status" });
    }

    const now = new Date();
    const ticket = await populateTicket(
      Ticket.findByIdAndUpdate(
        id,
        {
          status,
          statusUpdatedBy: req.user._id,
          statusUpdatedAt: now,
          closedAt: status === "Pending" ? null : now,
        },
        { new: true }
      )
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.json({ success: true, message: "Ticket status updated", ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("Update ticket status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update ticket status" });
  }
};
