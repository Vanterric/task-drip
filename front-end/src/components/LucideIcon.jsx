import React from "react";
import * as LucideIcons from "lucide-react";

const kebabToPascalCase = (str) =>
  str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

const LucideIcon = ({ icon = "clipboard-check", size = 20, color = "currentColor", strokeWidth = 2, className = "" }) => {
  const IconComponent = LucideIcons[kebabToPascalCase(icon)] || LucideIcons.ClipboardCheck;

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
};

export default LucideIcon;
