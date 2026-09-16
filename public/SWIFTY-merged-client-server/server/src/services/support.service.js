import SupportTicket from "../models/SupportTicket.js";
import AppError from "../utils/AppError.js";
const createTicket = async (customerId, data) => SupportTicket.create({ customer: customerId, ...data });
const getCustomerTickets = async (customerId) => SupportTicket.find({ customer: customerId }).sort({ createdAt: -1 });
const getAllTickets = async () => SupportTicket.find().populate("customer", "name email phone").sort({ createdAt: -1 });
const reply = async (id, sender, content) => { const ticket = await SupportTicket.findById(id); if (!ticket) throw new AppError("Support ticket not found", 404); ticket.replies.push({ sender, content }); if (sender === "admin") ticket.status = "in_progress"; await ticket.save(); return ticket; };
const updateStatus = async (id, status) => { const ticket = await SupportTicket.findByIdAndUpdate(id, { status }, { new: true }); if (!ticket) throw new AppError("Support ticket not found", 404); return ticket; };
export default { createTicket, getCustomerTickets, getAllTickets, reply, updateStatus };
