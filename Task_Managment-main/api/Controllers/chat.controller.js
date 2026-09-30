
import { Chat } from "../Modals/Chat.modal.js";
import { Message } from "../Modals/Message.modal.js";
import { v2 as cloudinary } from 'cloudinary';
import User from "../Modals/User.modal.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


export const getUserChats = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;  
    console.log("🔍 Current user ID:", currentUserId);

    const chats = await Chat.find({ participants: currentUserId })
      .populate({
        path: "participants",
        select: "username name department",
        match: { _id: { $ne: currentUserId } }  
      })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const mappedChats = chats.map(chat => {
      const otherUser = chat.participants?.find(
        p => p && (p._id.toString() !== currentUserId.toString() && 
                   p.id?.toString() !== currentUserId.toString())
      );
      
      return {
        ...chat.toObject(),
        otherUser: otherUser || null,
      };
    });
    
    res.json({ 
      success: true,
      chats: mappedChats
    });
  } catch (err) {
    console.error("❌ Error in getUserChats:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const getOrCreateOneToOneChat = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user._id;

    let chat = await Chat.findOne({
      chatType: 'one-to-one',
      participants: { $all: [currentUserId, otherUserId], $size: 2 }
    })
      .populate('participants', 'username department')
      .populate('lastMessage');

    if (!chat) {
      chat = new Chat({
        participants: [currentUserId, otherUserId],
        chatType: 'one-to-one',
        isArchived: [],
        isMuted: []
      });
      await chat.save();
      chat = await Chat.findById(chat._id)
        .populate('participants', 'username department')
        .populate('lastMessage');
    }

    const isArchived = chat.isArchived.some(
      archive => archive.userId.toString() === currentUserId.toString()
    );

    // Return only the "other user" in participants
    const otherUser = chat.participants.find(
      p => p._id.toString() !== currentUserId.toString()
    );

    res.json({
      ...chat.toObject(),
      otherUser,
      isArchived
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;  
    if (!query) return res.status(400).json({ message: "Query is required" });

    const users = await User.find({
      username: { $regex: query, $options: "i" },  
    }).select("_id username department accountType");

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
