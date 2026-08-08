export default function UserAvatar({ user, size = "md", className = "" }) {
  const sizes = { sm: 28, md: 40, lg: 64 };
  const px = sizes[size] || sizes.md;
  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt=""
        className={`user-avatar user-avatar-img ${className}`}
        width={px}
        height={px}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span
      className={`user-avatar user-avatar-initial ${className}`}
      style={{ width: px, height: px, fontSize: px * 0.4 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
