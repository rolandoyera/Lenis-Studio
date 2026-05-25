"use client";

import { useContactModal } from "../ContactModalProvider";
import ArrowButton from "./ArrowButton";

export default function ContactButton({
  children = "Contact",
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { open } = useContactModal();
  return (
    <ArrowButton onClick={open} className={`${className}`}>
      {children}
    </ArrowButton>
  );
}
