import express from "express";
import {
  createTicket,
  getAllTicketsForIT,
  getMyTickets,
  updateTicketStatus,
} from "../Controllers/ticket.controller.js";

const router = express.Router();

router.post("/", createTicket);
router.get("/my", getMyTickets);
router.get("/it", getAllTicketsForIT);
router.patch("/:id/status", updateTicketStatus);

export default router;
