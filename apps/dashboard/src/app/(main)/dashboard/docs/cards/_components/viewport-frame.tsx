"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ViewportFrameProps {
  /** Inner viewport width in px — drives which Tailwind breakpoints apply. */
  width: number;
  children: React.ReactNode;
}

/** Copy every attribute (class, style, data-*) from a source element onto a target. */
function mirrorAttributes(source: Element, target: Element) {
  for (const { name } of Array.from(target.attributes)) {
    if (!source.hasAttribute(name)) target.removeAttribute(name);
  }
  for (const { name, value } of Array.from(source.attributes)) {
    target.setAttribute(name, value);
  }
}

/**
 * Renders children inside an iframe so they get their own viewport width, which
 * makes Tailwind's responsive breakpoints (`sm:`, `lg:`, …) resolve against the
 * frame instead of the real browser window. The parent document's stylesheets
 * and dark-mode class are mirrored in, and content is portaled — so anything
 * rendered here stays live and updates as you edit.
 */
export function ViewportFrame({ width, children }: ViewportFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(320);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    // Mirror the parent's stylesheets into the iframe, re-syncing on HMR /
    // theme changes that mutate the document head.
    const syncStyles = () => {
      for (const stale of Array.from(
        doc.head.querySelectorAll("[data-mirror]"),
      )) {
        stale.remove();
      }
      for (const node of Array.from(
        document.head.querySelectorAll('style, link[rel="stylesheet"]'),
      )) {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-mirror", "");
        doc.head.appendChild(clone);
      }
    };

    // Carry over the font/theme attributes the boot script sets on <html> and
    // the font-variable classes on <body> — without `data-font`, `--font-sans`
    // never resolves and the iframe falls back to a serif default.
    const syncShell = () => {
      mirrorAttributes(document.documentElement, doc.documentElement);
      mirrorAttributes(document.body, doc.body);
      doc.body.style.margin = "0";
      doc.body.style.background = "transparent";
    };

    syncStyles();
    syncShell();
    setBody(doc.body);

    const headObserver = new MutationObserver(syncStyles);
    headObserver.observe(document.head, { childList: true, subtree: true });

    // Re-sync theme/font when the user switches them at runtime.
    const shellObserver = new MutationObserver(syncShell);
    shellObserver.observe(document.documentElement, {
      attributes: true,
    });
    shellObserver.observe(document.body, { attributes: true });

    // Grow the iframe to fit its content so cards aren't clipped.
    const resizeObserver = new ResizeObserver(() => {
      setHeight(doc.body.scrollHeight);
    });
    resizeObserver.observe(doc.body);

    return () => {
      headObserver.disconnect();
      shellObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title={`${width}px viewport`}
      style={{ width, height, border: 0, display: "block" }}
    >
      {body && createPortal(children, body)}
    </iframe>
  );
}
