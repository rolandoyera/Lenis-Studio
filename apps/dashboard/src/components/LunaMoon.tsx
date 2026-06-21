"use client";

/**
 * LunaMoon — animated moon icon for the "Luna" AI assistant.
 *
 * Next.js (app or pages router) + Tailwind 4. Zero global CSS required:
 * the keyframes ride along in a <style> tag rendered once.
 *
 *   <LunaMoon thinking={isStreaming} />                 // default: "breathe"
 *   <LunaMoon variant="orbit" thinking size={28} />
 *   <LunaMoon variant="phase" className="text-clay-600" />
 *
 * Color comes from CSS `currentColor`, so set it with any text-color
 * utility (e.g. className="text-ink-900" / "text-cream-50").
 * Respects `prefers-reduced-motion`.
 */

import * as React from "react";

import { AI_ASSISTANT_NAME } from "@/lib/ai-assistant";

type LunaVariant = "phase" | "orbit" | "breathe" | "shimmer" | "constellation";

export interface LunaMoonProps extends React.SVGProps<SVGSVGElement> {
  /** Animate the "thinking" state. Default false (idle / static). */
  thinking?: boolean;
  /** Which motion treatment to use. Default "breathe". */
  variant?: LunaVariant;
  /** Pixel size (width & height). Default 32. */
  size?: number;
}

function useLunaId() {
  return React.useId().replace(/[:]/g, "");
}

export default function LunaMoon({
  thinking = false,
  variant = "breathe",
  size = 32,
  className,
  ...rest
}: LunaMoonProps) {
  const id = useLunaId();
  const m = `mask-${id}`;
  const g = `grad-${id}`;
  const on = thinking ? " luna-on" : "";

  return (
    <>
      <LunaStyles />
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label={
          thinking ? `${AI_ASSISTANT_NAME} is thinking` : AI_ASSISTANT_NAME
        }
        className={`luna luna-${variant}${on}${className ? ` ${className}` : ""}`}
        style={{ overflow: "visible", color: "currentColor" }}
        {...rest}
      >
        <defs>
          <mask id={m}>
            <circle cx="50" cy="50" r="33" fill="#fff" />
            <circle
              className="luna-cut"
              cx={variant === "phase" ? 64 : 63}
              cy={variant === "phase" ? 42 : 40}
              r={variant === "phase" ? 30 : 27}
              fill="#000"
            />
          </mask>
          {variant === "shimmer" && (
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          )}
        </defs>

        {/* Breathe glow sits behind the moon */}
        {variant === "breathe" && (
          <circle
            className="luna-glow"
            cx="50"
            cy="50"
            r="33"
            fill="currentColor"
            opacity="0"
          />
        )}

        {variant === "shimmer" ? (
          <g mask={`url(#${m})`}>
            <circle cx="50" cy="50" r="33" fill="currentColor" />
            <rect
              className="luna-band"
              x="34"
              y="8"
              width="20"
              height="84"
              fill={`url(#${g})`}
            />
          </g>
        ) : (
          <circle
            className="luna-body"
            cx="50"
            cy="50"
            r="33"
            fill="currentColor"
            mask={`url(#${m})`}
          />
        )}

        {/* Orbit spark */}
        {variant === "orbit" && (
          <g className="luna-orbit-grp">
            <g className="luna-spark" transform="translate(50,10)">
              <path
                fill="currentColor"
                d="M0,-6 L1.4,-1.4 L6,0 L1.4,1.4 L0,6 L-1.4,1.4 L-6,0 L-1.4,-1.4 Z"
              />
            </g>
          </g>
        )}

        {/* Constellation stars */}
        {variant === "constellation" && (
          <g fill="currentColor">
            <path
              className="luna-star s1"
              d="M80,18 l1.1,-3.6 1.1,3.6 3.6,1.1 -3.6,1.1 -1.1,3.6 -1.1,-3.6 -3.6,-1.1 Z"
            />
            <circle className="luna-star s2" cx="88" cy="40" r="2" />
            <circle className="luna-star s3" cx="71" cy="11" r="1.6" />
          </g>
        )}
      </svg>
    </>
  );
}

/* ----------------------------------------------------------------
   Keyframes. Rendered once (guarded) so N moons share one <style>.
   ---------------------------------------------------------------- */
function LunaStyles() {
  return <style data-luna-styles="">{LUNA_CSS}</style>;
}

const LUNA_CSS = `
.luna{display:inline-block;vertical-align:middle;}
.luna .luna-orbit-grp{transform-origin:50px 50px;}
.luna-breathe .luna-glow,.luna-breathe .luna-body{transform-origin:50px 50px;}
.luna-constellation .luna-star{transform-box:fill-box;transform-origin:center;}

/* PHASE — terminator sweeps */
@keyframes luna-phase{0%,100%{transform:translateX(7px);}50%{transform:translateX(-13px);}}
.luna-phase.luna-on .luna-cut{animation:luna-phase 2.6s cubic-bezier(.32,.72,.24,1) infinite;}

/* ORBIT — spark circles, twinkling */
@keyframes luna-orbit{to{transform:rotate(360deg);}}
@keyframes luna-spark{0%,100%{opacity:.5;}50%{opacity:1;}}
.luna-orbit.luna-on .luna-orbit-grp{animation:luna-orbit 3.4s linear infinite;}
.luna-orbit.luna-on .luna-spark{animation:luna-spark 1.1s cubic-bezier(.32,.72,.24,1) infinite;}

/* BREATHE — glow swells, moon gently grows */
@keyframes luna-glow{0%,100%{opacity:.15;transform:scale(1);}50%{opacity:.5;transform:scale(1.18);}}
@keyframes luna-grow{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}}
.luna-breathe.luna-on .luna-glow{animation:luna-glow 2.4s cubic-bezier(.32,.72,.24,1) infinite;}
.luna-breathe.luna-on .luna-body{animation:luna-grow 2.4s cubic-bezier(.32,.72,.24,1) infinite;}

/* SHIMMER — light band sweeps the surface */
@keyframes luna-shimmer{0%{transform:translateX(-46px);}60%,100%{transform:translateX(46px);}}
.luna-shimmer.luna-on .luna-band{animation:luna-shimmer 2.2s cubic-bezier(.16,1,.3,1) infinite;}

/* CONSTELLATION — moon floats, stars twinkle */
@keyframes luna-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-3.5px);}}
@keyframes luna-twinkle{0%,100%{opacity:.12;transform:scale(.55);}50%{opacity:1;transform:scale(1);}}
.luna-constellation.luna-on .luna-body{animation:luna-float 3.2s cubic-bezier(.32,.72,.24,1) infinite;}
.luna-constellation.luna-on .luna-star{animation:luna-twinkle 1.6s cubic-bezier(.32,.72,.24,1) infinite;}
.luna-constellation.luna-on .luna-star.s2{animation-delay:.5s;}
.luna-constellation.luna-on .luna-star.s3{animation-delay:1s;}

@media (prefers-reduced-motion:reduce){.luna.luna-on *{animation:none !important;}}
`;
