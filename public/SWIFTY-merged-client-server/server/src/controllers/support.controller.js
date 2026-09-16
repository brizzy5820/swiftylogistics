import supportService from "../services/support.service.js";
export const create = async (req, res) => res.status(201).json({ success: true, ticket: await supportService.createTicket(req.user._id, req.body) });
export const mine = async (req, res) => res.status(200).json({ success: true, tickets: await supportService.getCustomerTickets(req.user._id) });
export const all = async (req, res) => res.status(200).json({ success: true, tickets: await supportService.getAllTickets() });
export const reply = async (req, res) => res.status(200).json({ success: true, ticket: await supportService.reply(req.params.id, req.user.role === "admin" ? "admin" : "customer", req.body.content) });
export const status = async (req, res) => res.status(200).json({ success: true, ticket: await supportService.updateStatus(req.params.id, req.body.status) });
