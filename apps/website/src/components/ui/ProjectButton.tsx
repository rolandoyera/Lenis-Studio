"use client";

import { useProjectModal } from "../ProjectModalProvider";
import ArrowButton from "./ArrowButton";

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      eventParams?: Record<string, any>,
    ) => void;
  }
}

export default function ProjectButton({
  children = "Contact",
  className = "",
  location = "general",
}: {
  children?: React.ReactNode;
  className?: string;
  location?: string;
}) {
  const { open } = useProjectModal();

  const handleClick = () => {
    open();

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "project_button_click", {
        button_location: location,
        button_text: typeof children === "string" ? children : "Contact",
      });
    }
  };

  return (
    <ArrowButton onClick={handleClick} className={`${className}`}>
      {children}
    </ArrowButton>
  );
}
