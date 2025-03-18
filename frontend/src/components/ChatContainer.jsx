import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // State for managing hovered message and delete button
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  // image
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      markMessagesAsRead(selectedUser._id);
    }

    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [
    selectedUser,
    getMessages,
    markMessagesAsRead,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle clicks outside the delete button
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDelete && !event.target.closest(".message-options")) {
        setShowDelete(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDelete]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={messagesContainerRef}
      >
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isCurrentUser = message.senderId === authUser._id;

          return (
            <div
              key={message._id}
              className={`chat ${
                isCurrentUser ? "chat-end" : "chat-start"
              } relative group`}
              ref={isLastMessage ? messageEndRef : null}
              onMouseEnter={() => setHoveredMessageId(message._id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isCurrentUser
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              {/* Message content */}
              <div className="chat-bubble flex flex-col relative">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
                    onClick={() => {
                      setSelectedImage(message.image);
                      setShowImageModal(true);
                    }}
                  />
                )}
                {message.text && (
                  <p
                    dangerouslySetInnerHTML={{
                      __html: message.text.replace(/\n/g, "<br>"),
                    }}
                  />
                )}

                {/* Options button positioned relative to the message bubble */}
                {isCurrentUser && hoveredMessageId === message._id && (
                  <button
                    style={{ fontSize: "25px" }}
                    className="absolute -left-8 top-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 message-options h-5 "
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDelete(
                        message._id === showDelete ? null : message._id
                      );
                    }}
                  >
                    ...
                  </button>
                )}

                {/* Delete button */}
                {isCurrentUser && showDelete === message._id && (
                  <div
                    className="absolute -left-28 top-1/2 -translate-y-1/2 z-10 message-options"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="bg-white shadow-lg text-red-500 text-xs p-2 rounded hover:bg-gray-100"
                      onClick={() => {
                        useChatStore.getState().deleteMessage(message._id);
                        setShowDelete(null);
                      }}
                    >
                      Xóa tin nhắn
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-3xl w-full">
            <button
              className="absolute top-2 right-2 bg-white p-1 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Expanded Attachment"
              className="w-full rounded-lg object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
