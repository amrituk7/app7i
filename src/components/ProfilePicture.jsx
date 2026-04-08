import React, { useState, useRef } from "react";
import { uploadProfilePicture, deleteProfilePicture } from "../firebase";
import { useToast } from "../context/ToastContext";
import "./ProfilePicture.css";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function ProfilePicture({ 
  studentId, 
  studentName, 
  profilePicture, 
  editable = false,
  size = "large",
  onUpdate 
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const sizeClasses = {
    small: "profile-pic-small",
    medium: "profile-pic-medium",
    large: "profile-pic-large"
  };

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }

    setUploading(true);

    try {
      const url = await uploadProfilePicture(studentId, file);
      showToast("Profile picture updated", "success");
      if (onUpdate) onUpdate(url);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      showToast("Failed to upload profile picture", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Remove profile picture?")) return;

    setUploading(true);

    try {
      await deleteProfilePicture(studentId);
      showToast("Profile picture removed", "success");
      if (onUpdate) onUpdate(null);
    } catch (error) {
      console.error("Error removing profile picture:", error);
      showToast("Failed to remove profile picture", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`profile-picture-container ${sizeClasses[size]}`}>
      <div className="profile-picture-wrapper">
        {profilePicture ? (
          <img 
            src={profilePicture} 
            alt={studentName || "Profile"} 
            className="profile-picture-image"
          />
        ) : (
          <div className="profile-picture-initials">
            {getInitials(studentName)}
          </div>
        )}

        {uploading && (
          <div className="profile-picture-loading">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {editable && !uploading && (
        <div className="profile-picture-actions">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="pic-btn upload"
          >
            {profilePicture ? "Change" : "Upload"}
          </button>
          
          {profilePicture && (
            <button 
              type="button"
              onClick={handleRemove}
              className="pic-btn remove"
            >
              Remove
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
