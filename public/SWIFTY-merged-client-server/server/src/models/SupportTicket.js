import mongoose from "mongoose";
const supportTicketSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true, trim: true, maxlength: 150 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  replies: [{ sender: { type: String, enum: ["customer", "admin"] }, content: { type: String, trim: true, maxlength: 2000 }, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true });
export default mongoose.model("SupportTicket", supportTicketSchema);
