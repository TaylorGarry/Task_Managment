// import { Message } from "../Modals/Message.modal.js";
// import { Chat } from "../Modals/Chat.modal.js";
// import { v2 as cloudinary } from 'cloudinary';

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// export const sendOneToOneMessage = async (req, res) => {
//   try {
//     const { chatId, text } = req.body;  
//     const senderId = req.user._id;
//     const io = req.io;

//     console.log("📨 Sending message - Chat ID:", chatId, "Text:", text, "Sender:", senderId);

//     const chat = await Chat.findById(chatId);
//     if (!chat) {
//       console.log("❌ Chat not found:", chatId);
//       return res.status(404).json({ error: "Chat not found" });
//     }

//     if (!chat.participants.includes(senderId.toString())) {
//       console.log("❌ User not in chat participants");
//       return res.status(403).json({ error: "You are not a participant" });
//     }

//     const newMessage = await Message.create({
//       chatId,
//       sender: senderId,
//       content: { 
//         text: text || "", 
//         media: [] 
//       },
//       messageType: text ? "text" : "empty",
//       readBy: [{ userId: senderId, readAt: new Date() }],
//     });

//     console.log("✅ Message created:", newMessage._id);

//     await Chat.findByIdAndUpdate(chatId, { 
//       lastMessage: newMessage._id, 
//       updatedAt: new Date() 
//     });

//     const fullMessage = await Message.findById(newMessage._id)
//       .populate("sender", "username department")
//       .populate("repliedTo");

//     console.log("✅ Full message populated:", fullMessage);
//     const socketData = {
//       chatId: chatId,
//       message: fullMessage
//     };
    
//     console.log("📡 Emitting socket event 'new_message' to chat:", chatId);
//     console.log("Socket data:", JSON.stringify(socketData, null, 2));
    
//     io.to(chatId.toString()).emit("new_message", socketData);
    
//     chat.participants.forEach(participantId => {
//       if (participantId.toString() !== senderId.toString()) {
//         io.to(participantId.toString()).emit("new_message", socketData);
//       }
//     });

//     return res.json({ 
//       success: true, 
//       message: fullMessage 
//     });

//   } catch (err) {
//     console.error("❌ Error in sendOneToOneMessage:", err);
//     res.status(500).json({ 
//       success: false,
//       error: err.message 
//     });
//   }
// };

// export const editMessage = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//     const { text } = req.body;
//     const userId = req.user._id || req.user.id;
//     const io = req.io;
    
//     console.log("✏️ Editing message:", { messageId, userId, text });
    
//     // Validate input
//     if (!text || text.trim() === '') {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Message text cannot be empty' 
//       });
//     }
    
//     const trimmedText = text.trim();
    
//     // Find the message with chat populated
//     const message = await Message.findById(messageId)
//       .populate('chatId', 'participants');
    
//     if (!message) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'Message not found' 
//       });
//     }
    
//     // Check if user is the sender
//     if (message.sender.toString() !== userId.toString()) {
//       return res.status(403).json({ 
//         success: false,
//         error: 'Can only edit your own messages' 
//       });
//     }
    
//     // Check if it's a media message
//     if (message.messageType === 'media' || 
//         (message.content.media && message.content.media.length > 0)) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Media messages cannot be edited' 
//       });
//     }
    
//     // Optional: Check if message is too old to edit (e.g., 15 minutes)
//     const messageAge = Date.now() - new Date(message.createdAt).getTime();
//     const maxEditTime = 15 * 60 * 1000; // 15 minutes in milliseconds
    
//     if (messageAge > maxEditTime) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Message can only be edited within 15 minutes of sending' 
//       });
//     }
    
//     // Save original text for edit history (only if first edit)
//     const originalText = message.content.text;
    
//     // Initialize editHistory if it doesn't exist
//     if (!message.editHistory) {
//       message.editHistory = [];
//     }
    
//     // Add current text to edit history before updating
//     if (!message.isEdited) {
//       // First edit - save original text
//       message.editHistory.push({
//         text: originalText,
//         editedAt: new Date()
//       });
//     } else {
//       // Subsequent edit - save current text before updating
//       message.editHistory.push({
//         text: message.content.text,
//         editedAt: new Date()
//       });
//     }
    
//     // Limit edit history to last 5 edits (optional)
//     if (message.editHistory.length > 5) {
//       message.editHistory = message.editHistory.slice(-5);
//     }
    
//     // Update message
//     message.content.text = trimmedText;
//     message.isEdited = true;
//     message.updatedAt = new Date();
    
//     // Update messageType if it was empty
//     if (!message.messageType || message.messageType === '') {
//       message.messageType = 'text';
//     }
    
//     await message.save();
    
//     // Populate sender info for response
//     const updatedMessage = await Message.findById(messageId)
//       .populate('sender', 'username name department');
    
//     console.log("✅ Message edited successfully:", {
//       messageId,
//       originalText,
//       newText: trimmedText,
//       editCount: message.editHistory.length
//     });
    
//     // Prepare socket data
//     const socketData = {
//       chatId: message.chatId._id.toString(),
//       messageId: messageId,
//       text: trimmedText,
//       isEdited: true,
//       editedAt: message.updatedAt,
//       sender: {
//         _id: updatedMessage.sender._id,
//         username: updatedMessage.sender.username,
//         name: updatedMessage.sender.name
//       }
//     };
    
//     console.log("📡 Emitting message_edited event:", socketData);
    
//     // Emit to chat room
//     io.to(message.chatId._id.toString()).emit('message_edited', socketData);
    
//     // Also emit to individual participants (optional)
//     if (message.chatId.participants) {
//       message.chatId.participants.forEach(participantId => {
//         if (participantId.toString() !== userId.toString()) {
//           io.to(participantId.toString()).emit('message_edited', socketData);
//         }
//       });
//     }
    
//     res.json({
//       success: true,
//       message: {
//         _id: updatedMessage._id,
//         chatId: updatedMessage.chatId,
//         sender: updatedMessage.sender,
//         content: updatedMessage.content,
//         messageType: updatedMessage.messageType,
//         isEdited: updatedMessage.isEdited,
//         editHistory: updatedMessage.editHistory,
//         createdAt: updatedMessage.createdAt,
//         updatedAt: updatedMessage.updatedAt
//       }
//     });
    
//   } catch (error) {
//     console.error("❌ Error editing message:", error);
//     res.status(500).json({ 
//       success: false,
//       error: error.message 
//     });
//   }
// };

// export const deleteMessage = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//     const userId = req.user._id;
    
//     const message = await Message.findById(messageId);
    
//     if (!message) {
//       return res.status(404).json({ error: 'Message not found' });
//     }
    
//     if (message.sender.toString() !== userId.toString()) {
//       return res.status(403).json({ error: 'Can only delete your own messages' });
//     }
    
//     if (message.content.media && message.content.media.length > 0) {
//       for (const media of message.content.media) {
//         if (media.publicId) {
//           await cloudinary.uploader.destroy(media.publicId);
//         }
//       }
//     }
    
//     await Message.findByIdAndDelete(messageId);
    
//     req.io.to(message.chatId.toString()).emit('message_deleted', {
//       messageId,
//       chatId: message.chatId
//     });
    
//     res.json({ message: 'Message deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const getChatMessages = async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const { page = 1, limit = 50 } = req.query;
//     const userId = req.user._id;
    
//     const chat = await Chat.findById(chatId);
//     if (!chat || !chat.participants.includes(userId)) {
//       return res.status(403).json({ error: 'Not a participant in this chat' });
//     }
    
//     const messages = await Message.find({ chatId })
//       .populate('sender', 'username department')
//       .populate('repliedTo')
//       .populate('forwardedFrom')
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit));
    
//     const unreadMessageIds = messages
//       .filter(msg => !msg.readBy.some(read => read.userId.toString() === userId))
//       .map(msg => msg._id);
    
//     if (unreadMessageIds.length > 0) {
//       await Message.updateMany(
//         { _id: { $in: unreadMessageIds } },
//         { $push: { readBy: { userId, readAt: new Date() } } }
//       );
//     }
    
//     const totalMessages = await Message.countDocuments({ chatId });
    
//     res.json({
//       messages: messages.reverse(),  
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: totalMessages,
//         pages: Math.ceil(totalMessages / limit)
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const reactToMessage = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//     const { emoji } = req.body;
//     const userId = req.user._id;
    
//     const message = await Message.findById(messageId);
    
//     if (!message) {
//       return res.status(404).json({ error: 'Message not found' });
//     }
//     message.reactions = message.reactions.filter(
//       reaction => reaction.userId.toString() !== userId.toString()
//     );
//     if (emoji) {
//       message.reactions.push({
//         userId,
//         emoji,
//         reactedAt: new Date()
//       });
//     }
    
//     await message.save();
//     req.io.to(message.chatId.toString()).emit('message_reaction', {
//       messageId,
//       chatId: message.chatId,
//       userId,
//       emoji: emoji || null,  
//       reactions: message.reactions
//     });
    
//     res.json(message.reactions);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const markAsRead = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//     const userId = req.user._id;
    
//     const message = await Message.findById(messageId);
    
//     if (!message) {
//       return res.status(404).json({ error: 'Message not found' });
//     }
//     const alreadyRead = message.readBy.some(
//       read => read.userId.toString() === userId.toString()
//     );
    
//     if (!alreadyRead) {
//       message.readBy.push({
//         userId,
//         readAt: new Date()
//       });
      
//       await message.save();
//       req.io.to(message.sender.toString()).emit('message_read', {
//         messageId,
//         chatId: message.chatId,
//         readBy: userId,
//         readAt: new Date()
//       });
//     }
    
//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



import { Message } from "../Modals/Message.modal.js";
import { Chat } from "../Modals/Chat.modal.js";
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
           
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// export const uploadFile = async (req, res) => {
//   try {
//     const file = req.file;
//     const { chatId } = req.body;

//     if (!file) {
//       return res.status(400).json({ success: false, error: "No file provided" });
//     }

//     const isImage = file.mimetype.startsWith("image/");
//     const isVideo = file.mimetype.startsWith("video/");
//     const isAudio = file.mimetype.startsWith("audio/");
//     const isRaw = !isImage && !isVideo && !isAudio;

//     const timestamp = Date.now();
//     const uniqueId = uuidv4().split("-")[0];

//     const originalExt = file.originalname.split(".").pop();
//     const finalPublicId = `${timestamp}_${uniqueId}${isRaw ? `.${originalExt}` : ""}`;

//     const folderPath = chatId
//       ? `chat-files/${chatId}`
//       : "chat-files/temp";

//     let result;

//     // ---------------------------
//     // RAW FILE UPLOAD (PDF/XLSX/DOCX/etc.)
//     // ---------------------------
//     if (isRaw) {
//       // PDFs: upload as "auto" for proper content-type
//       const uploadType = originalExt.toLowerCase() === "pdf" ? "auto" : "raw";

//       result = await new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           {
//             resource_type: uploadType,
//             folder: folderPath,
//             public_id: finalPublicId,
//             use_filename: true,
//             unique_filename: false,
//             overwrite: true,
//             // Only use raw_convert for files Cloudinary supports
//             raw_convert: ["docx", "pptx", "csv", "txt"].includes(originalExt) ? "auto" : undefined,
//           },
//           (err, res) => (err ? reject(err) : resolve(res))
//         );

//         stream.end(file.buffer);
//       });
//     } 
//     // ---------------------------
//     // IMAGE / VIDEO UPLOAD
//     // ---------------------------
//     else {
//       result = await new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           {
//             resource_type: isImage ? "image" : "video",
//             folder: folderPath,
//             public_id: finalPublicId,
//           },
//           (err, res) => (err ? reject(err) : resolve(res))
//         );

//         stream.end(file.buffer);
//       });
//     }

//     return res.status(201).json({
//       success: true,
//       message: "File uploaded successfully",
//       media: {
//         url: result.secure_url,
//         publicId: result.public_id,
//         filename: file.originalname,
//         size: result.bytes,
//         resourceType: isRaw ? "raw" : (isImage ? "image" : "video"),
//       },
//     });

//   } catch (err) {
//     console.error("❌ Upload error:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

//upper uploadFile controller is working for  excel image not for pdf (from line no 412 to 499).


export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const { chatId } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }

    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    const isAudio = file.mimetype.startsWith("audio/");
    const isRaw = !isImage && !isVideo && !isAudio;

    const timestamp = Date.now();
    const uniqueId = uuidv4().split("-")[0];

    const originalExt = file.originalname.split(".").pop();
    const folderPath = chatId
      ? `chat-files/${chatId}`
      : "chat-files/temp";

    let result;


    if (isRaw) {
      const isPDF = originalExt.toLowerCase() === "pdf";
      
      if (isPDF) {
        console.log("📄 Uploading PDF file...");
        
        result = await cloudinary.uploader.upload(
          `data:application/pdf;base64,${file.buffer.toString('base64')}`,
          {
            resource_type: "raw",
            folder: folderPath,
            public_id: `${timestamp}_${uniqueId}.pdf`,  
            type: "upload",
            access_mode: "public",
            context: `filename=${file.originalname}|content_type=application/pdf`
          }
        );
        
        if (!result.secure_url.endsWith('.pdf')) {
          result.secure_url = result.secure_url + '.pdf';
        }
        
      } else {
        const finalPublicId = `${timestamp}_${uniqueId}${isRaw ? `.${originalExt}` : ""}`;
        
        result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: folderPath,
              public_id: finalPublicId,
              use_filename: true,
              unique_filename: false,
              overwrite: true,
              raw_convert: ["docx", "pptx", "csv", "txt"].includes(originalExt.toLowerCase()) ? "auto" : undefined,
            },
            (err, res) => (err ? reject(err) : resolve(res))
          );
          stream.end(file.buffer);
        });
      }
    } 
    else {
      const finalPublicId = `${timestamp}_${uniqueId}`;
      
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: isImage ? "image" : "video",
            folder: folderPath,
            public_id: finalPublicId,
          },
          (err, res) => (err ? reject(err) : resolve(res))
        );
        stream.end(file.buffer);
      });
    }

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      media: {
        url: result.secure_url,
        publicId: result.public_id,
        filename: file.originalname,
        size: result.bytes,
        resourceType: isRaw ? "raw" : (isImage ? "image" : "video"),
      },
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


export const sendOneToOneMessage = async (req, res) => {
  try {
    const { chatId, text, repliedTo, media } = req.body;  
    const senderId = req.user._id;
    const io = req.io;

    console.log("📨 Sending message - Chat ID:", chatId, "Text:", text, "Sender:", senderId);
    console.log("📎 Media attached:", media ? media.length : 0);

    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log("❌ Chat not found:", chatId);
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.participants.includes(senderId.toString())) {
      console.log("❌ User not in chat participants");
      return res.status(403).json({ error: "You are not a participant" });
    }

    // Parse media if provided (should be an array of media objects from upload endpoint)
    let mediaArray = [];
    try {
      if (media) {
        if (typeof media === 'string') {
          mediaArray = JSON.parse(media);
        } else if (Array.isArray(media)) {
          mediaArray = media;
        }
      }
    } catch (parseError) {
      console.error("❌ Error parsing media data:", parseError);
      return res.status(400).json({ error: "Invalid media format" });
    }

    // Validate media objects
    const validMedia = [];
    if (mediaArray.length > 0) {
      for (const mediaItem of mediaArray) {
        if (mediaItem.url && mediaItem.publicId) {
          validMedia.push({
            url: mediaItem.url,
            publicId: mediaItem.publicId,
            mediaType: mediaItem.mediaType || "file",
            filename: mediaItem.filename || "file",
            size: mediaItem.size || 0,
            width: mediaItem.width || null,
            height: mediaItem.height || null
          });
        }
      }
    }

    // Determine message type
    let messageType = "text";
    if (validMedia.length > 0 && text && text.trim() !== "") {
      messageType = "mixed";
    } else if (validMedia.length > 0) {
      messageType = "media";
    } else if (!text || text.trim() === "") {
      // Check if we have media
      if (validMedia.length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      // If we have media but no text, it's already media type
    }

    const newMessage = await Message.create({
      chatId,
      sender: senderId,
      content: { 
        text: text || "", 
        media: validMedia 
      },
      messageType: messageType,
      repliedTo: repliedTo || null,
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    console.log("✅ Message created:", newMessage._id, "Type:", messageType);

    await Chat.findByIdAndUpdate(chatId, { 
      lastMessage: newMessage._id, 
      updatedAt: new Date() 
    });

    const fullMessage = await Message.findById(newMessage._id)
      .populate("sender", "username department")
      .populate("repliedTo");

    console.log("✅ Full message populated:", fullMessage);
    
    const socketData = {
      chatId: chatId,
      message: fullMessage
    };
    
    console.log("📡 Emitting socket event 'new_message' to chat:", chatId);
    console.log("Socket data:", JSON.stringify(socketData, null, 2));
    
    io.to(chatId.toString()).emit("new_message", socketData);
    
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== senderId.toString()) {
        io.to(participantId.toString()).emit("new_message", socketData);
      }
    });

    return res.json({ 
      success: true, 
      message: fullMessage,
      mediaCount: validMedia.length
    });

  } catch (err) {
    console.error("❌ Error in sendOneToOneMessage:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const deleteUploadedFile = async (req, res) => {
  try {
    const { publicId, resourceType = "image" } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: "Public ID is required"
      });
    }

    // Check if this file is used in any message
    const messageWithFile = await Message.findOne({
      "content.media.publicId": publicId
    });

    if (messageWithFile) {
      return res.status(400).json({
        success: false,
        error: "File is already used in a message and cannot be deleted"
      });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    console.log(`🗑️ File deleted: ${publicId}`, result);

    res.json({
      success: true,
      message: "File deleted successfully",
      result
    });

  } catch (err) {
    console.error("❌ Error deleting file:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete file"
    });
  }
};

export const getChatMedia = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const { type } = req.query; // Optional: filter by media type (image, file, audio)
    
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ error: 'Not a participant in this chat' });
    }
    
    // Build query
    const query = { chatId };
    if (type) {
      query["content.media.mediaType"] = type;
    }
    query["content.media.0"] = { $exists: true }; // Only messages with media
    
    const messages = await Message.find(query)
      .select("content.media sender createdAt")
      .populate("sender", "username department")
      .sort({ createdAt: -1 });
    
    // Extract all media from messages
    const allMedia = [];
    messages.forEach(message => {
      if (message.content.media && message.content.media.length > 0) {
        message.content.media.forEach(media => {
          allMedia.push({
            ...media.toObject(),
            messageId: message._id,
            sender: message.sender,
            createdAt: message.createdAt
          });
        });
      }
    });
    
    res.json({
      success: true,
      media: allMedia,
      total: allMedia.length
    });
    
  } catch (error) {
    console.error("❌ Error getting chat media:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const io = req.io;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }
    
    // Delete media files from Cloudinary
    if (message.content.media && message.content.media.length > 0) {
      for (const media of message.content.media) {
        if (media.publicId) {
          try {
            await cloudinary.uploader.destroy(media.publicId, {
              resource_type: media.resourceType || "image"
            });
            console.log(`🗑️ Deleted media from Cloudinary: ${media.publicId}`);
          } catch (cloudinaryError) {
            console.error(`❌ Error deleting media ${media.publicId}:`, cloudinaryError);
            // Continue with deletion even if Cloudinary delete fails
          }
        }
      }
    }
    
    await Message.findByIdAndDelete(messageId);
    
    console.log(`✅ Message deleted: ${messageId}`);
    
    io.to(message.chatId.toString()).emit('message_deleted', {
      messageId,
      chatId: message.chatId
    });
    
    res.json({ 
      success: true,
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error("❌ Error deleting message:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id || req.user.id;
    const io = req.io;
    
    console.log("✏️ Editing message:", { messageId, userId, text });
    
    // Validate input
    if (!text || text.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Message text cannot be empty' 
      });
    }
    
    const trimmedText = text.trim();
    
    // Find the message with chat populated
    const message = await Message.findById(messageId)
      .populate('chatId', 'participants');
    
    if (!message) {
      return res.status(404).json({ 
        success: false,
        error: 'Message not found' 
      });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false,
        error: 'Can only edit your own messages' 
      });
    }
    
    // Check if it's a media message
    if (message.messageType === 'media' || message.messageType === 'mixed' || 
        (message.content.media && message.content.media.length > 0)) {
      return res.status(400).json({ 
        success: false,
        error: 'Media messages cannot be edited' 
      });
    }
    
    // Optional: Check if message is too old to edit (e.g., 15 minutes)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const maxEditTime = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    if (messageAge > maxEditTime) {
      return res.status(400).json({ 
        success: false,
        error: 'Message can only be edited within 15 minutes of sending' 
      });
    }
    
    // Save original text for edit history (only if first edit)
    const originalText = message.content.text;
    
    // Initialize editHistory if it doesn't exist
    if (!message.editHistory) {
      message.editHistory = [];
    }
    
    // Add current text to edit history before updating
    if (!message.isEdited) {
      // First edit - save original text
      message.editHistory.push({
        text: originalText,
        editedAt: new Date()
      });
    } else {
      // Subsequent edit - save current text before updating
      message.editHistory.push({
        text: message.content.text,
        editedAt: new Date()
      });
    }
    
    // Limit edit history to last 5 edits (optional)
    if (message.editHistory.length > 5) {
      message.editHistory = message.editHistory.slice(-5);
    }
    
    // Update message
    message.content.text = trimmedText;
    message.isEdited = true;
    message.updatedAt = new Date();
    
    // Update messageType if it was empty
    if (!message.messageType || message.messageType === '') {
      message.messageType = 'text';
    }
    
    await message.save();
    
    // Populate sender info for response
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'username name department');
    
    console.log("✅ Message edited successfully:", {
      messageId,
      originalText,
      newText: trimmedText,
      editCount: message.editHistory.length
    });
    
    // Prepare socket data
    const socketData = {
      chatId: message.chatId._id.toString(),
      messageId: messageId,
      text: trimmedText,
      isEdited: true,
      editedAt: message.updatedAt,
      sender: {
        _id: updatedMessage.sender._id,
        username: updatedMessage.sender.username,
        name: updatedMessage.sender.name
      }
    };
    
    console.log("📡 Emitting message_edited event:", socketData);
    
    // Emit to chat room
    io.to(message.chatId._id.toString()).emit('message_edited', socketData);
    
    // Also emit to individual participants (optional)
    if (message.chatId.participants) {
      message.chatId.participants.forEach(participantId => {
        if (participantId.toString() !== userId.toString()) {
          io.to(participantId.toString()).emit('message_edited', socketData);
        }
      });
    }
    
    res.json({
      success: true,
      message: {
        _id: updatedMessage._id,
        chatId: updatedMessage.chatId,
        sender: updatedMessage.sender,
        content: updatedMessage.content,
        messageType: updatedMessage.messageType,
        isEdited: updatedMessage.isEdited,
        editHistory: updatedMessage.editHistory,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt
      }
    });
    
  } catch (error) {
    console.error("❌ Error editing message:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;
    
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ error: 'Not a participant in this chat' });
    }
    
    const messages = await Message.find({ chatId })
      .populate('sender', 'username department')
      .populate('repliedTo')
      .populate('forwardedFrom')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const unreadMessageIds = messages
      .filter(msg => !msg.readBy.some(read => read.userId.toString() === userId))
      .map(msg => msg._id);
    
    if (unreadMessageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessageIds } },
        { $push: { readBy: { userId, readAt: new Date() } } }
      );
    }
    
    const totalMessages = await Message.countDocuments({ chatId });
    
    res.json({
      messages: messages.reverse(),  
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    const io = req.io;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    message.reactions = message.reactions.filter(
      reaction => reaction.userId.toString() !== userId.toString()
    );
    
    if (emoji) {
      message.reactions.push({
        userId,
        emoji,
        reactedAt: new Date()
      });
    }
    
    await message.save();
    
    io.to(message.chatId.toString()).emit('message_reaction', {
      messageId,
      chatId: message.chatId,
      userId,
      emoji: emoji || null,  
      reactions: message.reactions
    });
    
    res.json(message.reactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const io = req.io;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const alreadyRead = message.readBy.some(
      read => read.userId.toString() === userId.toString()
    );
    
    if (!alreadyRead) {
      message.readBy.push({
        userId,
        readAt: new Date()
      });
      
      await message.save();
      io.to(message.sender.toString()).emit('message_read', {
        messageId,
        chatId: message.chatId,
        readBy: userId,
        readAt: new Date()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const proxyDownload = async (req, res) => {
  try {
    const { url, filename } = req.query;
    const userId = req.user?._id || req.user?.id;

    console.log("📥 Proxy download requested:", {
      userId,
      url: url?.substring(0, 200),
      filename,
      userAgent: req.headers["user-agent"],
      referer: req.headers["referer"],
    });

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL is required",
      });
    }

    // Decode incoming URL
    const decodedUrl = decodeURIComponent(url);

    console.log("🌐 Decoded URL:", {
      url: decodedUrl,
      isCloudinary: decodedUrl.includes("cloudinary.com"),
      isLocal: decodedUrl.includes("localhost"),
    });

    // Validate Cloudinary URL
    if (
      !decodedUrl.includes("cloudinary.com") &&
      !decodedUrl.includes("res.cloudinary.com")
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid Cloudinary URL",
      });
    }

    // 🚫 IMPORTANT FIX:
    // ❌ DO NOT MODIFY RAW URLs (PDF, Excel, Word, ZIP)
    // ❌ Do not add fl_attachment
    // ❌ Do not add filename=...
    // These break Cloudinary signature and corrupt documents
    const finalUrl = decodedUrl;

    console.log("🚀 Final download URL (NO MODIFICATION):", finalUrl);

    // Fetch from Cloudinary exactly as-is
    const response = await fetch(finalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
      },
      redirect: "follow",
    });

    console.log("📊 Cloudinary response:", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentDisposition: response.headers.get("content-disposition"),
    });

    if (!response.ok) {
      throw new Error(
        `Cloudinary returned ${response.status} ${response.statusText}`
      );
    }

    // Extract headers returned from Cloudinary
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    let contentDisposition =
      response.headers.get("content-disposition") ||
      `attachment; filename="${filename || "download"}"`;

    // Set headers BEFORE streaming
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", contentDisposition);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-cache");

    console.log("📤 Streaming file to client...");

    // STREAM INSTEAD OF BUFFERING — avoids corruption
    response.body.pipe(res);
  } catch (error) {
    console.error("❌ Proxy download error:", error);

    res.status(500).json({
      success: false,
      error: "Download failed",
      message: error.message,
      details: { url: req.query.url },
    });
  }
};
