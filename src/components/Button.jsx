import React from "react";

function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
}) {
  const styles =
    variant === "secondary"
      ? "secondary-button"
      : "primary-button";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;