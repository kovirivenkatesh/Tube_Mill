import { useRef, useState } from "react";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import UserAvatar from "./UserAvatar";

const MAX_BYTES = 650 * 1024;

export default function ProfilePhotoEditor({ layout = "stacked" }) {
  const { user, updateProfileImage, removeProfileImage } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  function pickFile() {
    inputRef.current?.click();
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast("Image must be smaller than 650 KB.", "error");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      await updateProfileImage(dataUrl);
      showToast("Profile photo updated.", "success");
    } catch (err) {
      showToast(err.message || "Could not upload photo.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!user?.profileImage) return;
    setBusy(true);
    try {
      await removeProfileImage();
      showToast("Profile photo removed.", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`profile-photo-editor ${layout}`}>
      <UserAvatar user={user} size="lg" />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={onFileChange}
        aria-label="Upload profile photo"
      />
      <div className="profile-photo-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={pickFile} disabled={busy}>
          {busy ? "…" : "Change photo"}
        </button>
        {user?.profileImage && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove} disabled={busy}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
