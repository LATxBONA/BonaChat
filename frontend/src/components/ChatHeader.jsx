import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  // handle img
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleImageClick = () => {
    setSelectedImage(selectedUser.profilePic || "/avatar.png");
    setShowImageModal(true);
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div
              className="size-10 rounded-full relative cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>

      {/* Image Modal */}
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
              alt="Profile Avatar"
              className="w-full rounded-lg object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatHeader;
