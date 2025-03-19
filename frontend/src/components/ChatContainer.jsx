import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

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
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // State quản lý tin nhắn được hover và nút xóa
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showDelete, setShowDelete] = useState(null);

  // Quản lý ảnh khi click vào tin nhắn có ảnh
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // State modal xác nhận xóa tin nhắn
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Lấy thông báo tin nhắn chưa đọc nè
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

  // Xử lý click bên ngoài để đóng nút xóa
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

  const handleDeleteMessage = () => {
    const message = messages.find((m) => m._id === messageToDelete);
    if (!message) return;

    const oneHourAgo = new Date(Date.now() - 3600000);
    const messageTime = new Date(message.createdAt);

    if (messageTime < oneHourAgo) {
      toast.error(
        "Bạn chỉ có thể xóa tin nhắn trong vòng 1 tiếng sau khi gửi."
      );
      setShowConfirmModal(false);
      return;
    }

    deleteMessage(messageToDelete);
    setShowConfirmModal(false);
    setShowDelete(null);
  };

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

              {/* Nội dung tin nhắn */}
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

                {/* Nút mở tùy chọn */}
                {isCurrentUser && hoveredMessageId === message._id && (
                  <button
                    style={{ fontSize: "25px" }}
                    className="absolute -left-8 top-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 message-options h-5"
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

                {/* Nút xóa tin nhắn */}
                {isCurrentUser && showDelete === message._id && (
                  <div
                    className="absolute -left-28 top-1/2 -translate-y-1/2 z-10 message-options"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="bg-white shadow-lg text-red-500 text-xs p-2 rounded hover:bg-gray-100"
                      onClick={() => {
                        setMessageToDelete(message._id);
                        setShowConfirmModal(true);
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

      {/* Modal hiển thị ảnh */}
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

      {/* Modal xác nhận xóa tin nhắn */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 transform scale-95 animate-scaleIn">
            {/* Icon cảnh báo */}
            <div className="flex justify-center">
              <svg
                className="w-16 h-16 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 1114.14 14.14A10 10 0 014.93 4.93z"
                ></path>
              </svg>
            </div>

            {/* Nội dung cảnh báo */}
            <h2 className="text-lg font-semibold text-gray-800 text-center mt-4">
              Xóa tin nhắn?
            </h2>
            <p className="text-sm text-gray-500 text-center mt-2">
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa tin
              nhắn này không?
            </p>

            {/* Nút bấm */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                className="bg-red-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-600 transition-all"
                onClick={() => {
                  useChatStore.getState().deleteMessage(messageToDelete);
                  setShowConfirmModal(false);
                  setShowDelete(null);
                  handleDeleteMessage();
                }}
              >
                Xóa ngay
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium hover:bg-gray-400 transition-all"
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
