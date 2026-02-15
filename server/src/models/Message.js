const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "file", "audio"], default: "file" },
    name: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, default: "" },
    encryptedContent: { type: String, default: "" },
    iv: { type: String, default: "" },
    attachments: [attachmentSchema],
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    editedAt: { type: Date, default: null },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedForEveryone: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ content: "text" });

module.exports = mongoose.model("Message", messageSchema);