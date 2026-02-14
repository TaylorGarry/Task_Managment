import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  FiSearch,
  FiPaperclip,
  FiSend,
  FiMoreVertical,
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiXCircle,
  FiImage,
  FiMusic,
  FiVideo
} from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { IoDocument } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getUserChats,
  getOrCreateOneToOneChat,
  searchUsers,
} from "../features/slices/chatSlice.js";
import {
  sendMessage,
  editMessage,
  deleteMessage,
  addIncomingMessage,
  setMessagesForChat,
  replaceTempMessage,
  updateEditedMessage,
  updateMessageLocally,
  removeMessage,
  setEditingMessageId,
  setDeletingMessageId,
  clearEditingState,
  uploadFile,
  sendMessageWithFiles,
  clearUploadedFiles
} from "../features/slices/messageSlice.js";
import { socket } from "../socket.js";
import api from "../../api.js";

const ChatUI = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { chats, searchResults } = useSelector((state) => state.chat);
  const {
    messagesByChat,
    editingMessageId,
    deletingMessageId,
    uploading,
    uploadError
  } = useSelector((state) => state.message);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id || user?._id;

  const [selectedChat, setSelectedChat] = useState(null);
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sendingMessages, setSendingMessages] = useState(new Set());
  const [editingText, setEditingText] = useState("");
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const unreadNotificationCountRef = useRef(0);
  const defaultTitleRef = useRef(document.title);

  const [typingUsers, setTypingUsers] = useState({});
  const [, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const remoteTypingTimeoutsRef = useRef({});
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const openedFromNotificationRef = useRef(null);

  const pushLiveNotification = useCallback((senderName, messageText, chatId) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setLiveNotifications((prev) => [
      { id, senderName, messageText, chatId },
      ...prev.slice(0, 2),
    ]);

    setTimeout(() => {
      setLiveNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  const updateTitleWithUnreadCount = useCallback(() => {
    unreadNotificationCountRef.current += 1;
    document.title = `(${unreadNotificationCountRef.current}) New Message${unreadNotificationCountRef.current > 1 ? "s" : ""} | Chat`;
  }, []);

  const clearUnreadTitleCount = useCallback(() => {
    unreadNotificationCountRef.current = 0;
    document.title = defaultTitleRef.current;
  }, []);

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = newHeight + 'px';
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [text]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    const oversizedFiles = files.filter(file => file.size > 100 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed 100MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    setShowFilePreview(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setShowFilePreview(false);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <FiImage className="text-blue-500" />;
    if (file.type.startsWith('audio/')) return <FiMusic className="text-green-500" />;
    if (file.type.startsWith('video/')) return <FiVideo className="text-purple-500" />;
    return <IoDocument className="text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSend = async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTypingRef.current && selectedChat && socketConnected) {
      setIsTyping(false);
      isTypingRef.current = false;
      socket.emit("stop_typing", {
        chatId: selectedChat._id
      });
    }

    if (!selectedChat) {
      return;
    }

    const hasText = text.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;

    if (!hasText && !hasFiles) {
      return;
    }

    const messageText = text;
    setText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setSendingMessages(prev => new Set(prev).add(tempId));

    const filePreviews = selectedFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    const tempMessage = {
      _id: tempId,
      chatId: selectedChat._id,
      sender: {
        _id: userId,
        id: userId,
        username: user.name || user.username
      },
      content: {
        text: messageText,
        media: filePreviews.map(({ file, previewUrl }) => ({
          url: previewUrl,
          filename: file.name,
          size: file.size,
          type: file.type,
          mimeType: file.type,
          isTemp: true
        }))
      },
      messageType: selectedFiles.length > 0
        ? (hasText ? "mixed" : "media")
        : "text",
      createdAt: new Date().toISOString(),
      isSending: true,
      isTemp: true
    };

    dispatch(addIncomingMessage({
      chatId: selectedChat._id,
      message: tempMessage
    }));

    try {
      const result = await dispatch(sendMessageWithFiles({
        chatId: selectedChat._id,
        text: messageText,
        files: selectedFiles,
      })).unwrap();


      filePreviews.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
      });

      if (result.message) {
        dispatch(replaceTempMessage({
          chatId: selectedChat._id,
          tempId: tempId,
          realMessage: result.message
        }));
      }

      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });

    } catch (error) {

      filePreviews.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
      });

      dispatch(replaceTempMessage({
        chatId: selectedChat._id,
        tempId: tempId,
        realMessage: null
      }));

      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });

      if (error.message?.includes('Failed to upload')) {
        alert('Failed to upload one or more files. Please check file size and type.');
      } else {
        alert(error.message || "Failed to send message");
      }

      setText(messageText);

    } finally {
      setSelectedFiles([]);
      setShowFilePreview(false);

      dispatch(clearUploadedFiles());
    }
  };
  const renderFilePreview = () => {
    if (!showFilePreview || selectedFiles.length === 0) return null;

    return (
      <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-slate-700">
            Files to send ({selectedFiles.length})
          </h4>
          <button
            onClick={() => {
              setSelectedFiles([]);
              setShowFilePreview(false);
            }}
            className="text-slate-500 hover:text-slate-700"
          >
            <FiXCircle size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="text-lg">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <FiXCircle size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMessageMedia = (media) => {
    if (!media || media.length === 0) return null;

    const handleFileDownload = (file) => {
      const isPdf = file.resourceType === "raw" && file.filename.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        const pdfUrl = file.url.includes("?")
          ? `${file.url}&fl_attachment:false`
          : `${file.url}?fl_attachment:false`;

        window.open(pdfUrl, "_blank");
        return;
      }

      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.filename || "";
      document.body.appendChild(link);
      link.click();
      link.remove();
    };




    return (
      <div className="mt-2 space-y-2">
        {media.map((item, index) => {
          const isImage = item.mediaType === 'image' ||
            item.mimeType?.startsWith('image/') ||
            item.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)$/i);

          const isExcel = item.mediaType === 'excel' ||
            item.mimeType?.includes('excel') ||
            item.mimeType?.includes('spreadsheet') ||
            item.filename?.match(/\.(xlsx|xls|xlsm|xlsb|xltx|xltm|xlam|csv)$/i);

          const isPDF = item.mediaType === 'pdf' ||
            item.mimeType === 'application/pdf' ||
            item.filename?.match(/\.pdf$/i);

          const isDocument = item.mediaType === 'document' ||
            item.mimeType?.includes('word') ||
            item.mimeType?.includes('msword') ||
            item.filename?.match(/\.(docx|doc|dotx|dotm|rtf)$/i);

          const isArchive = item.mediaType === 'archive' ||
            item.mimeType?.includes('zip') ||
            item.mimeType?.includes('rar') ||
            item.mimeType?.includes('compressed') ||
            item.filename?.match(/\.(zip|rar|7z|tar|gz|bz2)$/i);

          const isText = item.mediaType === 'text' ||
            item.mimeType?.startsWith('text/') ||
            item.filename?.match(/\.(txt|json|xml|html|css|js|ts|py|java|cpp)$/i);

          const isVideo = item.mediaType === 'video' ||
            item.mimeType?.startsWith('video/') ||
            item.url?.match(/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v)$/i);

          const isAudio = item.mediaType === 'audio' ||
            item.mimeType?.startsWith('audio/') ||
            item.url?.match(/\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i);

          const isPresentation = item.mediaType === 'presentation' ||
            item.mimeType?.includes('presentation') ||
            item.mimeType?.includes('powerpoint') ||
            item.filename?.match(/\.(pptx|ppt|pptm|potx|potm)$/i);

          const isDownloadableDocument = isExcel || isPDF || isDocument || isArchive ||
            isText || isPresentation ||
            item.resourceType === 'raw' ||
            item.mediaType === 'file';

          return (
            <div key={index} className="max-w-xs">
              {isImage ? (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={item.url}
                    alt={item.filename || 'Image'}
                    className="w-full h-auto max-h-48 object-cover cursor-pointer"
                    onClick={() => window.open(item.url, '_blank')}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                    }}
                  />
                  {item.filename && (
                    <div className="p-2 bg-slate-50 text-xs text-slate-600 truncate">
                      {item.filename}
                    </div>
                  )}
                </div>
              ) : isVideo ? (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <video
                    src={item.url}
                    controls
                    className="w-full max-h-48"
                    onError={(e) => {
                    }}
                  />
                  <div className="p-2 bg-slate-50 text-xs text-slate-600 truncate">
                    {item.filename || 'Video file'}
                  </div>
                </div>
              ) : isAudio ? (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <audio
                    src={item.url}
                    controls
                    className="w-full"
                    onError={(e) => {
                    }}
                  />
                  <div className="p-2 bg-slate-50 text-xs text-slate-600 truncate">
                    {item.filename || 'Audio file'}
                  </div>
                </div>
              ) : isDownloadableDocument ? (
                <button
                  onClick={() => handleFileDownload(item)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
                >
                  {isExcel ? (
                    <div className="text-green-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 1.5q.41 0 .7.3.3.29.3.7v19q0 .41-.3.7-.29.3-.7.3H7q-.41 0-.7-.3-.3-.29-.3-.7V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h5V1.5q0-.41.3-.7.29-.3.7-.3zM6 13.28l1.42 2.66h2.14l-2.38-3.87 2.34-3.8H7.46l-1.3 2.4-.05.08-.04.09-.64-1.28-.64-1.29H2l2.27 3.82-2.48 3.85h2.16zM22.5 21v-3h-2v3zm0-4.5v-3h-2v3zm0-4.5v-3h-2v3zm0-4.5v-3h-2v3z" />
                      </svg>
                    </div>
                  ) : isPDF ? (
                    <div className="text-red-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
                      </svg>
                    </div>
                  ) : isDocument ? (
                    <div className="text-blue-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    </div>
                  ) : isPresentation ? (
                    <div className="text-orange-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10-9h-4v1h4v-1zm0 2h-4v1h4v-1zm0 2h-4v1h4v-1z" />
                      </svg>
                    </div>
                  ) : isArchive ? (
                    <div className="text-yellow-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
                      </svg>
                    </div>
                  ) : isText ? (
                    <div className="text-gray-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    </div>
                  ) : (
                    <IoDocument className="text-slate-500 text-2xl" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.filename || 'Document'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.size ? formatFileSize(item.size) : 'Unknown size'}
                      {isExcel && ' • Excel'}
                      {isPDF && ' • PDF'}
                      {isDocument && ' • Document'}
                      {isPresentation && ' • Presentation'}
                      {isArchive && ' • Archive'}
                      {isText && ' • Text'}
                    </p>
                  </div>

                  <div className="text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                </button>
              ) : (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <IoDocument className="text-slate-500 text-2xl" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.filename || 'File'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.size ? formatFileSize(item.size) : 'Click to open'}
                    </p>
                  </div>
                  <div className="text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", () => {
      setSocketConnected(true);

      if (userId) {
        socket.emit("join", userId);
      }
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("connect_error", (error) => {
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, [userId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearUnreadTitleCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearUnreadTitleCount();
    };
  }, [clearUnreadTitleCount]);

  useEffect(() => {
    const handleUserTyping = (data) => {
      const sameChat = String(data?.chatId || "") === String(selectedChat?._id || "");
      if (sameChat && String(data.userId) !== String(userId)) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: true
        }));

        if (remoteTypingTimeoutsRef.current[data.userId]) {
          clearTimeout(remoteTypingTimeoutsRef.current[data.userId]);
        }

        remoteTypingTimeoutsRef.current[data.userId] = setTimeout(() => {
          setTypingUsers(prev => {
            const newTyping = { ...prev };
            delete newTyping[data.userId];
            return newTyping;
          });
          delete remoteTypingTimeoutsRef.current[data.userId];
        }, 2500);
      }
    };

    const handleUserStopTyping = (data) => {
      const sameChat = String(data?.chatId || "") === String(selectedChat?._id || "");
      if (sameChat && String(data.userId) !== String(userId)) {
        setTypingUsers(prev => {
          const newTyping = { ...prev };
          delete newTyping[data.userId];
          return newTyping;
        });

        if (remoteTypingTimeoutsRef.current[data.userId]) {
          clearTimeout(remoteTypingTimeoutsRef.current[data.userId]);
          delete remoteTypingTimeoutsRef.current[data.userId];
        }
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      Object.values(remoteTypingTimeoutsRef.current).forEach(clearTimeout);
      remoteTypingTimeoutsRef.current = {};
    };
  }, [selectedChat, userId]);

  useEffect(() => {

    const handleNewMessage = (data) => {
      if (data && data.message) {
        const chatId = data.chatId || data.message.chatId;
        const message = data.message;
        if (chatId) {
          const isMyMessage = message.sender?._id === userId ||
            message.sender?.id === userId ||
            message.sender === userId;

          if (isMyMessage) {
            const currentMessages = messagesByChat[chatId] || [];
            const matchingTempMessage = currentMessages.find(m =>
              m.isTemp &&
              m.content?.text === message.content?.text &&
              (m.sender?._id === userId || m.sender?.id === userId)
            );

            if (matchingTempMessage) {
              dispatch(replaceTempMessage({
                chatId,
                tempId: matchingTempMessage._id,
                realMessage: message
              }));

              setSendingMessages(prev => {
                const newSet = new Set(prev);
                newSet.delete(matchingTempMessage._id);
                return newSet;
              });
            } else {
              const messageExists = currentMessages.some(m => m._id === message._id);
              if (!messageExists) {
                dispatch(addIncomingMessage({ chatId, message }));
              }
            }
          } else {
            const currentMessages = messagesByChat[chatId] || [];
            const messageExists = currentMessages.some(m => m._id === message._id);

            if (!messageExists) {
              dispatch(addIncomingMessage({ chatId, message }));
            }

            const isCurrentChatOpen = selectedChat?._id === chatId;
            const senderName =
              message.sender?.username ||
              message.sender?.name ||
              "New message";
            const messageText =
              message.content?.text?.trim() ||
              (message.content?.media?.length ? "Sent an attachment" : "You received a new message");

            if (!isCurrentChatOpen || document.hidden) {
              pushLiveNotification(senderName, messageText, chatId);
            }

            if (document.hidden || !isCurrentChatOpen) {
              updateTitleWithUnreadCount();
            }

            if (document.hidden && "Notification" in window) {
              const showBrowserNotification = () => {
                const notification = new Notification(`Message from ${senderName}`, {
                  body: messageText,
                  icon: "/favicon.ico",
                  tag: `chat-${chatId}`,
                });
                notification.onclick = () => {
                  window.focus();
                };
              };

              if (Notification.permission === "granted") {
                showBrowserNotification();
              } else if (Notification.permission === "default") {
                Notification.requestPermission().then((permission) => {
                  if (permission === "granted") {
                    showBrowserNotification();
                  }
                });
              }
            }
          }
        }
      }
    };

    const handleMessageEdited = (data) => {
      if (data && data.messageId && data.chatId) {
        dispatch(updateEditedMessage({
          chatId: data.chatId,
          messageId: data.messageId,
          text: data.text,
          isEdited: true,
          editedAt: data.editedAt || new Date().toISOString(),
          updatedAt: data.editedAt || new Date().toISOString()
        }));

        if (editingMessageId === data.messageId) {
          dispatch(clearEditingState());
          setEditingText("");
        }
      }
    };

    const handleMessageDeleted = (data) => {
      if (data && data.messageId && data.chatId) {
        dispatch(removeMessage({
          chatId: data.chatId,
          messageId: data.messageId
        }));
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [dispatch, selectedChat, messagesByChat, userId, editingMessageId, pushLiveNotification, updateTitleWithUnreadCount]);

  useEffect(() => {
    dispatch(getUserChats());
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      dispatch(searchUsers(searchQuery));
    }
  }, [searchQuery, dispatch]);

  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) return;

    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/api/messages/chats/${chatId}/messages`);
      if (res.data?.messages) {
        dispatch(setMessagesForChat({
          chatId,
          messages: res.data.messages
        }));
      }
    } catch (err) {
    } finally {
      setIsLoadingMessages(false);
    }
  }, [dispatch]);

  const openChat = useCallback((chat) => {
    setSelectedChat(chat);
    setShowMessageMenu(null);
    setTypingUsers({});
    clearUnreadTitleCount();
    dispatch(clearEditingState());
    setEditingText("");

    socket.emit("join_chat", chat._id);

    fetchMessages(chat._id);

    if (userId) {
      socket.emit("message_seen", {
        chatId: chat._id,
        userId: userId
      });
    }
  }, [fetchMessages, userId, dispatch, clearUnreadTitleCount]);

  useEffect(() => {
    const openChatId = location.state?.openChatId;
    if (!openChatId) return;
    if (openedFromNotificationRef.current === openChatId) return;

    const targetChat = chats.find((c) => String(c._id) === String(openChatId));
    if (!targetChat) return;

    openedFromNotificationRef.current = openChatId;
    openChat(targetChat);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, chats, openChat, navigate, location.pathname]);

  const handleTyping = useCallback(() => {
    if (!selectedChat || !socketConnected) return;

    if (!isTypingRef.current) {
      setIsTyping(true);
      isTypingRef.current = true;
      socket.emit("typing", {
        chatId: selectedChat._id
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        setIsTyping(false);
        isTypingRef.current = false;
        socket.emit("stop_typing", {
          chatId: selectedChat._id
        });
      }
    }, 1500);
  }, [selectedChat, socketConnected]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTypingRef.current && selectedChat && socketConnected) {
        isTypingRef.current = false;
        socket.emit("stop_typing", {
          chatId: selectedChat._id
        });
      }
    };
  }, [selectedChat, socketConnected]);

  const handleSelectUser = async (userObj) => {
    try {
      const chat = await dispatch(getOrCreateOneToOneChat(userObj._id)).unwrap();
      setSelectedChat(chat);
      setSearchQuery("");
      clearUnreadTitleCount();
      dispatch(getUserChats());

      socket.emit("join_chat", chat._id);
      fetchMessages(chat._id);
    } catch (error) {
    }
  };

  const handleStartEdit = (message) => {
    if (message.sender?._id === userId || message.sender?.id === userId) {
      dispatch(setEditingMessageId(message._id));
      setEditingText(message.content?.text || "");
      setShowMessageMenu(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;

    try {
      dispatch(updateMessageLocally({
        chatId: selectedChat._id,
        messageId: editingMessageId,
        updates: {
          content: { text: editingText.trim() },
          isEdited: true,
          editedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));

      await dispatch(editMessage({
        messageId: editingMessageId,
        text: editingText.trim()
      })).unwrap();

      dispatch(clearEditingState());
      setEditingText("");

    } catch (error) {
      alert(error || "Failed to edit message");

      dispatch(clearEditingState());
      setEditingText("");
    }
  };

  const handleCancelEdit = () => {
    dispatch(clearEditingState());
    setEditingText("");
  };

  const handleDeleteMessage = async (messageId) => {

    try {
      dispatch(setDeletingMessageId(messageId));

      dispatch(removeMessage({
        chatId: selectedChat._id,
        messageId
      }));

      await dispatch(deleteMessage(messageId)).unwrap();
      dispatch(setDeletingMessageId(null));
      setShowMessageMenu(null);

    } catch (error) {
      alert(error || "Failed to delete message");
      dispatch(setDeletingMessageId(null));
    }
  };

  const chatMessages = selectedChat
    ? messagesByChat[selectedChat._id] || []
    : [];

  const messageMap = new Map();
  chatMessages.forEach(msg => {
    if (msg && msg._id) {
      messageMap.set(msg._id, msg);
    }
  });

  const uniqueMessages = Array.from(messageMap.values())
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const filteredMessages = uniqueMessages.filter(msg => {
    if (msg.isTemp || msg._id?.toString().startsWith('temp_')) {
      const messageTime = new Date(msg.createdAt);
      const now = new Date();
      const ageInSeconds = (now - messageTime) / 1000;

      if (ageInSeconds > 30) {
        return false;
      }
      return true;
    }
    return true;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMessageMenu && !event.target.closest('.message-menu')) {
        setShowMessageMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu]);

  return (
    <div className="w-full h-[calc(100vh-50px)] bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col md:flex-row p-2 sm:p-4 md:p-6 mt-12 md:mt-10 mb-2 overflow-hidden">
      {liveNotifications.length > 0 && (
        <div className="fixed right-4 top-16 z-[70] flex flex-col gap-3 w-[calc(100%-2rem)] sm:w-[26rem]">
          {liveNotifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => {
                const matchingChat = chats.find((c) => c._id === notif.chatId);
                if (matchingChat) {
                  openChat(matchingChat);
                }
                setLiveNotifications((prev) => prev.filter((item) => item.id !== notif.id));
              }}
              className="group text-left rounded-2xl overflow-hidden border border-cyan-100 shadow-[0_14px_40px_rgba(8,145,178,0.18)] bg-gradient-to-br from-white via-cyan-50 to-blue-50 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(8,145,178,0.22)] transition-all"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white grid place-content-center font-semibold">
                    {notif.senderName?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-cyan-700 font-semibold">Incoming Message</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{notif.senderName}</p>
                    <p className="text-sm text-slate-600 truncate">{notif.messageText}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/80 border border-cyan-100 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {selectedChat && (
        <div className="md:hidden flex items-center justify-between p-4 bg-white/90 border border-slate-200 rounded-t-xl mb-2 shadow-sm">
          <div className="flex items-center gap-3">
            <FiArrowLeft
              size={24}
              className="text-slate-600 cursor-pointer"
              onClick={() => setSelectedChat(null)}
            />
            <FaUserCircle size={40} className="text-slate-500" />
            <div>
              <p className="font-semibold text-sm">
                {selectedChat.otherUser?.username || "Unknown"}
              </p>
              <span className={`text-xs ${socketConnected ? "text-green-600" : "text-red-600"}`}>
                {socketConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
            <FiMoreVertical size={22} className="text-slate-600" />
        </div>
      )}
      <div
        className={`bg-white/90 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col shadow-sm 
          ${selectedChat ? "hidden md:flex" : "flex"}
          w-full md:w-1/4 lg:w-1/5 xl:w-1/6 overflow-hidden`}
      >
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <FaUserCircle size={40} className="text-slate-500 hidden md:block" />
          <div className="md:hidden flex items-center gap-3">
            <FaUserCircle size={45} className="text-slate-500" />
            <div>
              <p className="font-semibold text-sm lg:text-base">{user?.name || user?.username}</p>
              <span className={`text-xs ${socketConnected ? "text-green-600" : "text-red-600"}`}>
                {socketConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="font-semibold text-sm lg:text-base">{user?.name || user?.username}</p>
            <span className={`text-xs ${socketConnected ? "text-green-600" : "text-red-600"}`}>
              {socketConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="mt-3 md:mt-5 relative">
          <FiSearch className="absolute top-3 left-3 text-slate-400" size={18} />
          <input
            className="w-full py-2 pl-10 pr-4 rounded-full border border-slate-200 bg-slate-50 text-sm md:text-base focus:outline-none focus:border-blue-500"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && searchResults.length > 0 && (
            <div className="absolute top-12 w-full bg-white border border-slate-200 rounded-xl shadow-md max-h-64 overflow-y-auto z-50">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => handleSelectUser(u)}
                  className="p-3 cursor-pointer hover:bg-slate-100 text-sm md:text-base"
                >
                  {u.username} - {u.department}
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="mt-4 md:mt-6 font-semibold text-slate-700 text-sm md:text-base">Last chats</h3>
        <div className="mt-2 md:mt-4 space-y-2 md:space-y-4 flex-1 overflow-y-auto min-h-0">
          {chats.map((c) => {
            const otherUser = c.otherUser;
            const displayName = otherUser?.username || otherUser?.name || "Unknown";

            return (
              <div
                key={c._id}
                onClick={() => openChat(c)}
                className={`p-2 md:p-3 flex justify-between rounded-lg hover:bg-slate-100 cursor-pointer transition-colors ${selectedChat?._id === c._id ? "bg-blue-50 border border-blue-200" : ""
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm md:text-base truncate">
                    {displayName}
                  </p>
                  <p className="text-slate-500 text-xs md:text-sm truncate">
                    {c.lastMessage?.content?.text || "Start chatting..."}
                  </p>
                </div>
                {c.lastMessage && (
                  <span className="text-slate-400 text-xs ml-2 flex-shrink-0">
                    {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedChat ? (
        <div className="bg-white/80 border border-slate-200 rounded-xl flex flex-col shadow-sm mx-0 md:mx-2 lg:mx-4 w-full md:w-3/4 lg:w-4/5 xl:w-5/6 flex-1 min-h-0 overflow-hidden">
          <div className="hidden md:flex p-4 justify-between items-center bg-white border-b border-slate-200 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <FaUserCircle size={40} className="text-slate-500" />
                <div>
                  <h2 className="font-semibold text-lg">
                    {selectedChat.otherUser?.username || "Unknown"}
                  </h2>
                  <span className={`text-xs ${socketConnected ? "text-green-600" : "text-red-600"}`}>
                    {socketConnected ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            <FiMoreVertical size={22} className="text-slate-600" />
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-1 p-2 md:p-4 overflow-y-auto min-h-0 bg-slate-50/70"
             style={{ 
              maxHeight: 'calc(100vh - 250px)',  
              height: 'auto'
            }}
          >
            {isLoadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-slate-500 p-4 text-center">
                <FaUserCircle size={60} className="text-slate-300 mb-4 md:h-20 md:w-20" />
                <p className="text-base md:text-lg font-medium">No messages yet</p>
                <p className="text-xs md:text-sm mt-2">Say hello to start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-1 md:space-y-2">
                {filteredMessages.map((m, index) => {
                  if (!m || !m._id) return null;

                  const senderId = m.sender?._id || m.sender?.id || m.sender;
                  if (!senderId) return null;

                  const isTempMessage = m.isTemp || m._id.toString().startsWith('temp_');
                  const isMyMessage = senderId === userId;
                  const isEditing = editingMessageId === m._id;
                  const isDeleting = deletingMessageId === m._id;
                  const showDateSeparator = () => {
                    if (isTempMessage) return false;
                    const currentDate = new Date(m.createdAt);
                    const prevMessage = filteredMessages[index - 1];
                    if (!prevMessage) return true;
                    let prevIndex = index - 1;
                    while (prevIndex >= 0 &&
                      (filteredMessages[prevIndex].isTemp ||
                        filteredMessages[prevIndex]._id.toString().startsWith('temp_'))) {
                      prevIndex--;
                    }

                    const prevValidMessage = filteredMessages[prevIndex];
                    if (!prevValidMessage) return true;
                    const prevDate = new Date(prevValidMessage.createdAt);
                    return (
                      currentDate.getDate() !== prevDate.getDate() ||
                      currentDate.getMonth() !== prevDate.getMonth() ||
                      currentDate.getFullYear() !== prevDate.getFullYear()
                    );
                  };
                  const shouldShowDate = showDateSeparator();
                  return (
                    <div key={m._id}>
                      {shouldShowDate && !isTempMessage && (
                        <div className="flex justify-center my-4">
                          <div className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                            {new Date(m.createdAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      )}
                      <div
                        className={`flex ${isMyMessage ? "justify-end" : "justify-start"} group relative`}
                        onMouseEnter={() => isMyMessage && !isTempMessage && setShowMessageMenu(m._id)}
                        onMouseLeave={() => isMyMessage && showMessageMenu === m._id && setShowMessageMenu(null)}
                      >
                        {isMyMessage && !isTempMessage && (
                          <div
                            className={`absolute right-0 top-0 message-menu bg-white border border-slate-200 rounded-md shadow-md z-10 flex flex-col overflow-hidden transition-all duration-200 ${showMessageMenu === m._id
                                ? "opacity-100 visible scale-100"
                                : "opacity-0 invisible scale-95"
                              }`}
                            style={{ minWidth: '70px' }}
                          >
                            <button
                              onClick={() => handleStartEdit(m)}
                              className="px-3 py-2 text-xs sm:text-sm cursor-pointer text-blue-600 hover:bg-blue-50 text-left hover:text-blue-700 transition-colors"
                              onMouseEnter={(e) => e.stopPropagation()}
                            >
                              edit
                            </button>
                            <div className="border-t border-slate-100"></div>
                            <button
                              onClick={() => handleDeleteMessage(m._id)}
                              className="px-3 py-2 text-xs sm:text-sm cursor-pointer text-red-600 hover:bg-red-50 text-left hover:text-red-700 transition-colors"
                              onMouseEnter={(e) => e.stopPropagation()}
                            >
                              delete
                            </button>
                          </div>
                        )}
                        <div className={`max-w-[85%] sm:max-w-[80%] md:max-w-[70%] ${isMyMessage ? "text-right" : "text-left"}`}>
                          {!isMyMessage && (
                            <p className="text-xs font-medium text-slate-600 mb-1 ml-1">
                              {m.sender?.username || "User"}
                            </p>
                          )}
                          {isEditing ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-2 md:p-3">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm md:text-base"
                                rows="2"
                                autoFocus
                              />
                              <div className="flex justify-end space-x-2 mt-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-2 py-1 text-xs md:text-sm bg-slate-200 rounded hover:bg-slate-300 flex items-center"
                                >
                                  <FiX className="mr-1" /> Cancel
                                </button>
                                <button
                                  onClick={handleSaveEdit}
                                  className="px-2 py-1 text-xs md:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                                >
                                  <FiCheck className="mr-1" /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`inline-block px-3 py-2 md:px-4 md:py-2 rounded-2xl ${isMyMessage
                                  ? "bg-blue-600 text-white rounded-br-none"
                                  : "bg-white text-slate-800 rounded-bl-none border border-slate-200"
                                } ${isTempMessage ? "opacity-80" : ""} ${isDeleting ? "opacity-50" : ""}`}
                            >
                              {isTempMessage && (
                                <div className="flex items-center mb-1">
                                  <div className="w-2 h-2 md:w-3 md:h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                                  <span className="text-xs opacity-90">Sending...</span>
                                </div>
                              )}

                              {isDeleting && (
                                <div className="flex items-center mb-1">
                                  <div className="w-2 h-2 md:w-3 md:h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                                  <span className="text-xs opacity-90">Deleting...</span>
                                </div>
                              )}
                              {m.content?.text && (
                                <p className="break-words whitespace-pre-wrap text-sm md:text-base">
                                  {m.content.text}
                                </p>
                              )}
                              {m.content?.media?.length > 0 && renderMessageMedia(m.content.media)}
                            </div>
                          )}
                          <div className={`mt-1 flex items-center ${isMyMessage ? "justify-end" : "justify-start"}`}>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              {!isTempMessage && (
                                <span className="text-slate-400">
                                  {new Date(m.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                              <span>
                                {isTempMessage
                                  ? "Just now"
                                  : new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                              </span>
                              {m.isEdited && !isEditing && (
                                <span className="ml-1 text-slate-400 italic">(edited)</span>
                              )}
                              {isMyMessage && !isTempMessage && !isEditing && (
                                <span className="ml-1">
                                  {m.readBy?.length > 1 ? " ✓✓" : " ✓"}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {Object.keys(typingUsers).length === 1
                        ? 'Typing...'
                        : `${Object.keys(typingUsers).length} people typing...`
                      }
                    </span>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>
            )}
          </div>
          <div className="p-3 md:p-4 bg-white border-t border-slate-200 rounded-b-xl">
            {renderFilePreview()}
            <div className="flex items-center gap-2 md:gap-3">
              <label className="cursor-pointer">
                <FiPaperclip size={20} className="text-slate-500 hover:text-blue-600 transition" />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  className="w-full md:p-3 pl-4 pr-10 md:pr-12 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition text-sm md:text-base resize-none overflow-y-auto"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows="1"
                  style={{
                    minHeight: '40px',
                    maxHeight: '120px'
                  }}
                />
                {(text.trim() || selectedFiles.length > 0) && (
                  <button
                    onClick={handleSend}
                    className="absolute right-1 md:right-2 top-3 md:top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-1.5 md:p-2 rounded-full hover:bg-blue-700 transition"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiSend size={16} className="md:h-4 md:w-4" />
                    )}
                  </button>
                )}
              </div>
              {!text.trim() && selectedFiles.length === 0 && (
                <button
                  onClick={handleSend}
                  className="bg-slate-200 text-slate-500 p-2 md:p-3 rounded-full hover:bg-slate-300 transition"
                  disabled={!text.trim() && selectedFiles.length === 0}
                >
                  <FiSend size={18} className="md:h-5 md:w-5" />
                </button>
              )}
            </div>
            {uploadError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                Upload error: {uploadError}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex bg-white/80 border border-slate-200 rounded-xl flex-col shadow-sm mx-0 md:mx-2 lg:mx-4 w-full md:w-3/4 lg:w-4/5 xl:w-5/6 justify-center items-center p-4">
          <div className="text-center text-slate-500">
            <FaUserCircle size={80} className="mx-auto text-slate-400" />
            <h3 className="mt-4 text-xl font-semibold">Welcome to Chat</h3>
            <p className="mt-2">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatUI;
