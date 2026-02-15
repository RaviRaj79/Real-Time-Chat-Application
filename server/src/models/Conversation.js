const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    isGroup: { type: Boolean, default: false },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);