import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const getOtherParticipant = (conversation, userId) =>
    conversation.participants.find((p) => p._id.toString() !== userId.toString());

const updateConversationPreview = async (conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;

    const lastMessage = await Message.findOne({ conversation: conversationId }).sort({ createdAt: -1 });

    if (!lastMessage) {
        conversation.lastMessage = "";
        conversation.lastMessageAt = conversation.createdAt || new Date();
    } else {
        conversation.lastMessage = lastMessage.text;
        conversation.lastMessageAt = lastMessage.createdAt;
    }

    await conversation.save();
};

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({ participants: userId })
            .populate({ path: "participants", select: "-password" })
            .sort({ lastMessageAt: -1 });

        const result = conversations.map((convo) => {
            const other = getOtherParticipant(convo, userId);
            return {
                _id: convo._id,
                otherUser: other,
                lastMessage: convo.lastMessage,
                lastMessageAt: convo.lastMessageAt,
            };
        });

        res.status(200).json({ conversations: result });
    } catch (error) {
        console.log("Error in getConversations controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getOrCreateConversation = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { userId: otherUserId } = req.body;

        if (!otherUserId || otherUserId === userId) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const otherUser = await User.findById(otherUserId).select("-password");
        if (!otherUser) return res.status(404).json({ message: "User not found" });

        let conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, otherUserId],
            });
        }

        res.status(200).json({ conversationId: conversation._id, otherUser });
    } catch (error) {
        console.log("Error in getOrCreateConversation controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { id } = req.params;

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        const isParticipant = conversation.participants.some((p) => p.toString() === userId);
        if (!isParticipant) return res.status(403).json({ message: "Unauthorized" });

        const messages = await Message.find({ conversation: id })
            .populate({ path: "sender", select: "-password" })
            .sort({ createdAt: 1 });

        await Message.updateMany(
            { conversation: id, sender: { $ne: userId }, read: false },
            { read: true }
        );

        const otherUser = await User.findById(
            conversation.participants.find((p) => p.toString() !== userId)
        ).select("-password");

        res.status(200).json({ messages, otherUser });
    } catch (error) {
        console.log("Error in getMessages controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { text } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
        if (!isParticipant) return res.status(403).json({ message: "Unauthorized" });

        const message = await Message.create({
            conversation: id,
            sender: userId,
            text: text.trim(),
        });

        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populated = await Message.findById(message._id).populate({
            path: "sender",
            select: "-password",
        });

        res.status(201).json({ message: populated });
    } catch (error) {
        console.log("Error in sendMessage controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { conversationId, messageId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        const isParticipant = conversation.participants.some((p) => p.toString() === userId);
        if (!isParticipant) return res.status(403).json({ message: "Unauthorized" });

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.conversation.toString() !== conversationId) {
            return res.status(400).json({ message: "Message does not belong to this conversation" });
        }

        if (message.sender.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own messages" });
        }

        await Message.findByIdAndDelete(messageId);
        await updateConversationPreview(conversationId);

        res.status(200).json({ message: "Message deleted" });
    } catch (error) {
        console.log("Error in deleteMessage controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { id } = req.params;

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        const isParticipant = conversation.participants.some((p) => p.toString() === userId);
        if (!isParticipant) return res.status(403).json({ message: "Unauthorized" });

        await Message.deleteMany({ conversation: id });
        await Conversation.findByIdAndDelete(id);

        res.status(200).json({ message: "Conversation deleted" });
    } catch (error) {
        console.log("Error in deleteConversation controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUnreadDmCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({ participants: userId }).select("_id");
        const conversationIds = conversations.map((c) => c._id);

        const count = await Message.countDocuments({
            conversation: { $in: conversationIds },
            sender: { $ne: userId },
            read: false,
        });

        res.status(200).json({ count });
    } catch (error) {
        console.log("Error in getUnreadDmCount controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
