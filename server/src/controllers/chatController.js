const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { encryptText, decryptText } = require("../utils/crypto");

function messageView(message, viewerId) {
  const isDeletedForViewer = message.deletedFor.some((id) => id.toString() === viewerId.toString());
  if (message.deletedForEveryone || isDeletedForViewer) {
    return {
      id: message._id,
      conversation: message.conversation,
      sender: message.sender,
      content: "",
      attachments: [],
      status: message.status,
      editedAt: message.editedAt,
      createdAt: message.createdAt,
      deleted: true,
    };
  }

  let decryptedContent = message.content;
  if (!decryptedContent && message.encryptedContent && message.iv) {
    try {
      decryptedContent = decryptText(message.encryptedContent, message.iv);
    } catch (_error) {
      decryptedContent = "";
    }
  }

  return {
    id: message._id,
    conversation: message.conversation,
    sender: message.sender,
    content: decryptedContent,
    attachments: message.attachments,
    status: message.status,
    seenBy: message.seenBy,
    editedAt: message.editedAt,
    createdAt: message.createdAt,
  };
}

exports.createConversation = async (req, res, next) => {
  try {
    const { participantIds = [], isGroup = false, name = "" } = req.body;
    const currentUserId = req.user._id.toString();

    const uniqueParticipants = [...new Set([...participantIds, currentUserId])];
    if (uniqueParticipants.length < 2) {
      return res.status(400).json({ message: "Conversation requires at least two participants" });
    }

    if (!isGroup && uniqueParticipants.length === 2) {
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: uniqueParticipants, $size: 2 },
      }).populate("participants", "_id name email avatar isOnline lastSeen");

      if (existing) {
        return res.json({ conversation: existing });
      }
    }

    const conversation = await Conversation.create({
      name: isGroup ? name.trim() : "",
      isGroup,
      participants: uniqueParticipants,
      admins: isGroup ? [currentUserId] : [],
    });

    const populated = await Conversation.findById(conversation._id).populate(
      "participants",
      "_id name email avatar isOnline lastSeen",
    );

    return res.status(201).json({ conversation: populated });
  } catch (error) {
    return next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "_id name email avatar isOnline lastSeen")
      .limit(50);

    return res.json({ conversations });
  } catch (error) {
    return next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "_id name email avatar");

    const total = await Message.countDocuments({ conversation: conversationId });

    return res.json({
      page,
      limit,
      total,
      hasMore: page * limit < total,
      messages: messages.reverse().map((message) => messageView(message, req.user._id)),
    });
  } catch (error) {
    return next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content = "", attachments = [], encrypted = true } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Message content or attachment is required" });
    }

    const payload = encrypted ? encryptText(content.trim()) : { encryptedContent: "", iv: "" };

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: encrypted ? "" : content.trim(),
      encryptedContent: payload.encryptedContent,
      iv: payload.iv,
      attachments,
      status: "sent",
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Message.findById(message._id).populate("sender", "_id name email avatar");

    return res.status(201).json({ message: messageView(populated, req.user._id) });
  } catch (error) {
    return next(error);
  }
};

exports.editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "content is required" });
    }

    const message = await Message.findOne({ _id: messageId, sender: req.user._id });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const payload = encryptText(content.trim());
    message.content = "";
    message.encryptedContent = payload.encryptedContent;
    message.iv = payload.iv;
    message.editedAt = new Date();

    await message.save();

    const updated = await Message.findById(messageId).populate("sender", "_id name email avatar");

    return res.json({ message: messageView(updated, req.user._id) });
  } catch (error) {
    return next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { forEveryone = false } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isOwner = message.sender.toString() === req.user._id.toString();

    if (forEveryone && isOwner) {
      message.deletedForEveryone = true;
      message.content = "";
      message.encryptedContent = "";
      message.iv = "";
      message.attachments = [];
    } else {
      const alreadyDeleted = message.deletedFor.some((id) => id.toString() === req.user._id.toString());
      if (!alreadyDeleted) {
        message.deletedFor.push(req.user._id);
      }
    }

    await message.save();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

exports.markSeen = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        seenBy: { $ne: req.user._id },
      },
      {
        $addToSet: { seenBy: req.user._id },
        $set: { status: "seen" },
      },
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

exports.searchMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { q = "" } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const query = q.trim();
    if (!query) {
      return res.json({ messages: [] });
    }

    const textResults = await Message.find({
      conversation: conversationId,
      $text: { $search: query },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("sender", "_id name email avatar");

    return res.json({ messages: textResults.map((message) => messageView(message, req.user._id)) });
  } catch (error) {
    if (error instanceof mongoose.Error) {
      return res.status(400).json({ message: "Invalid request" });
    }

    return next(error);
  }
};