"use client";

import { Button } from "antd";
import { PropsWithChildren } from "react";

export const Mbutton = ({
  onClick,
  children,
  type = "normal",
  className = "",
  htmlType = "button",
}: {
  onClick: () => void;
  type?: "normal" | "text";
  className?: string;
  htmlType?: "button" | "submit";
} & PropsWithChildren) => {
  return (
    <Button
      type={type === "normal" ? "primary" : "text"}
      htmlType={htmlType}
      onClick={onClick}
      className={className}
    >
      {children}
    </Button>
  );
};
