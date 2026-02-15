const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 180 },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);