const User = require("../models/User");

exports.searchUsers = async (req, res, next) => {
  try {
    const { q = "" } = req.query;
    const query = q.trim();

    if (!query) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("_id name email avatar isOnline lastSeen")
      .limit(20);

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, bio } = req.body;
    const updates = {};

    if (typeof name === "string") {
      updates.name = name.trim();
    }

    if (typeof avatar === "string") {
      updates.avatar = avatar.trim();
    }

    if (typeof bio === "string") {
      updates.bio = bio.trim();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select(
      "_id name email avatar bio isOnline lastSeen",
    );

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};