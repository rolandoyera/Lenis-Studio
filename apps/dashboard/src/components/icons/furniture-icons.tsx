import type React from "react";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  shadow?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  padding?: number;
}

const makeIcon = (paths: React.ReactNode, displayName: string) => {
  const Icon = ({
    size = 20,
    color = "currentColor",
    strokeWidth = 1.5,
    opacity = 1,
    rotation = 0,
    shadow = 0,
    flipHorizontal = false,
    flipVertical = false,
    padding = 0,
  }: IconProps) => {
    const transforms: string[] = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (flipHorizontal) transforms.push("scaleX(-1)");
    if (flipVertical) transforms.push("scaleY(-1)");

    const viewBoxSize = 24 + padding * 2;
    const viewBoxOffset = -padding;
    const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

    return (
      <svg
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          opacity,
          transform: transforms.join(" ") || undefined,
          filter:
            shadow > 0
              ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))`
              : undefined,
        }}
      >
        <g
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        >
          {paths}
        </g>
      </svg>
    );
  };

  Icon.displayName = displayName;
  return Icon;
};

/* ─────────────────────────────────────────────────────────
   SOFA
   Sectional silhouette: wide seat, back rail, two arms
───────────────────────────────────────────────────────── */
const SofaIcon = makeIcon(
  <>
    {/* seat base */}
    <path d="M2 14h20v4H2z" />
    {/* back */}
    <path d="M4 14V9a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5" />
    {/* left arm */}
    <path d="M2 12a2 2 0 0 1 2-2v4H2v-2z" />
    {/* right arm */}
    <path d="M22 12a2 2 0 0 0-2-2v4h2v-2z" />
    {/* legs */}
    <path d="M5 18v2m14-2v2" />
    {/* cushion divider */}
    <path d="M12 10v4" />
  </>,
  "SofaIcon",
);

/* ─────────────────────────────────────────────────────────
   ARMCHAIR
   Single seat, curved back, visible arm rests
───────────────────────────────────────────────────────── */
const ArmchairIcon = makeIcon(
  <>
    {/* seat */}
    <path d="M5 14h14v3H5z" />
    {/* back */}
    <path d="M7 14V9.5C7 8.7 7.7 8 8.5 8h7c.8 0 1.5.7 1.5 1.5V14" />
    {/* left arm */}
    <path d="M5 12.5A1.5 1.5 0 0 1 6.5 11H7v3H5v-1.5z" />
    {/* right arm */}
    <path d="M19 12.5A1.5 1.5 0 0 0 17.5 11H17v3h2v-1.5z" />
    {/* legs */}
    <path d="M7 17v2m10-2v2" />
  </>,
  "ArmchairIcon",
);

/* ─────────────────────────────────────────────────────────
   COFFEE TABLE
   Low profile, slab top, tapered legs
───────────────────────────────────────────────────────── */
const CoffeeTableIcon = makeIcon(
  <>
    {/* top slab */}
    <rect x="2" y="10" width="20" height="3" rx="0.5" />
    {/* left leg */}
    <path d="M5 13v5" />
    {/* right leg */}
    <path d="M19 13v5" />
    {/* stretcher */}
    <path d="M5 16h14" />
  </>,
  "CoffeeTableIcon",
);

/* ─────────────────────────────────────────────────────────
   CONSOLE TABLE
   Tall, narrow, two legs, lower shelf
───────────────────────────────────────────────────────── */
const ConsoleTableIcon = makeIcon(
  <>
    {/* top */}
    <rect x="3" y="7" width="18" height="2.5" rx="0.5" />
    {/* left leg */}
    <path d="M6 9.5V20" />
    {/* right leg */}
    <path d="M18 9.5V20" />
    {/* lower shelf */}
    <path d="M6 15h12" />
  </>,
  "ConsoleTableIcon",
);

/* ─────────────────────────────────────────────────────────
   RUG
   Rectangular with woven border lines and fringe
───────────────────────────────────────────────────────── */
const RugIcon = makeIcon(
  <>
    {/* outer border */}
    <rect x="2" y="5" width="20" height="14" rx="1" />
    {/* inner frame */}
    <rect x="4.5" y="7.5" width="15" height="9" rx="0.5" />
    {/* centre diamond */}
    <path d="M12 9.5 L14.5 12 L12 14.5 L9.5 12 Z" />
  </>,
  "RugIcon",
);

/* ─────────────────────────────────────────────────────────
   DINING TABLE
   Round top, pedestal base
───────────────────────────────────────────────────────── */
const DiningTableIcon = makeIcon(
  <>
    {/* table top */}
    <ellipse cx="12" cy="10" rx="9" ry="3.5" />
    {/* pedestal */}
    <path d="M12 13.5V19" />
    {/* base */}
    <path d="M7 19h10" />
  </>,
  "DiningTableIcon",
);

/* ─────────────────────────────────────────────────────────
   BED
   Headboard, mattress, two pillows
───────────────────────────────────────────────────────── */
const BedIcon = makeIcon(
  <>
    {/* headboard */}
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V7z" />
    {/* mattress */}
    <rect x="3" y="9" width="18" height="8" rx="1" />
    {/* left pillow */}
    <rect x="5" y="10.5" width="5" height="3" rx="0.75" />
    {/* right pillow */}
    <rect x="14" y="10.5" width="5" height="3" rx="0.75" />
    {/* legs */}
    <path d="M5 17v2m14-2v2" />
  </>,
  "BedIcon",
);

/* ─────────────────────────────────────────────────────────
   WARDROBE
   Double door, handles, top cornice
───────────────────────────────────────────────────────── */
const WardrobeIcon = makeIcon(
  <>
    {/* carcass */}
    <rect x="3" y="4" width="18" height="18" rx="1" />
    {/* centre divider */}
    <path d="M12 4v18" />
    {/* cornice */}
    <path d="M3 7h18" />
    {/* left handle */}
    <path d="M10 13.5v1" />
    {/* right handle */}
    <path d="M14 13.5v1" />
  </>,
  "WardrobeIcon",
);

/* ─────────────────────────────────────────────────────────
   SIDE TABLE / NIGHTSTAND
   Small top, single drawer, two legs
───────────────────────────────────────────────────────── */
const SideTableIcon = makeIcon(
  <>
    {/* top */}
    <rect x="4" y="7" width="16" height="2" rx="0.5" />
    {/* drawer box */}
    <rect x="4" y="9" width="16" height="6" rx="0.5" />
    {/* drawer pull */}
    <path d="M10 12h4" />
    {/* legs */}
    <path d="M6 15v4m12-4v4" />
  </>,
  "SideTableIcon",
);

/* ─────────────────────────────────────────────────────────
   PENDANT LAMP
   Dome shade, cord, ceiling canopy
───────────────────────────────────────────────────────── */
const PendantLampIcon = makeIcon(
  <>
    {/* canopy */}
    <path d="M10 3h4" />
    {/* cord */}
    <path d="M12 3v5" />
    {/* dome shade */}
    <path d="M6 8a6 6 0 0 0 12 0H6z" />
    {/* light glow line */}
    <path d="M9 14h6" strokeOpacity="0.4" />
  </>,
  "PendantLampIcon",
);

/* ─────────────────────────────────────────────────────────
   FLOOR LAMP
   Arched stem, round base, shade
───────────────────────────────────────────────────────── */
const FloorLampIcon = makeIcon(
  <>
    {/* shade */}
    <path d="M9 4h6l1 4H8L9 4z" />
    {/* stem */}
    <path d="M12 8v12" />
    {/* base */}
    <path d="M8 20h8" />
  </>,
  "FloorLampIcon",
);

/* ─────────────────────────────────────────────────────────
   BOOKSHELF
   Three shelves, side panels
───────────────────────────────────────────────────────── */
const BookshelfIcon = makeIcon(
  <>
    {/* side panels */}
    <path d="M4 3v18m16-18v18" />
    {/* shelves */}
    <path d="M4 8h16" />
    <path d="M4 14h16" />
    {/* base */}
    <path d="M4 21h16" />
    {/* top */}
    <path d="M4 3h16" />
  </>,
  "BookshelfIcon",
);

/* ─────────────────────────────────────────────────────────
   DINING CHAIR
   Splat back, upholstered seat, four legs
───────────────────────────────────────────────────────── */
const DiningChairIcon = makeIcon(
  <>
    {/* back uprights */}
    <path d="M8 4v9m8-9v9" />
    {/* top rail */}
    <path d="M8 4h8" />
    {/* mid splat */}
    <path d="M8 8h8" />
    {/* seat */}
    <rect x="7" y="13" width="10" height="2.5" rx="0.5" />
    {/* front legs */}
    <path d="M9 15.5v5m6-5v5" />
  </>,
  "DiningChairIcon",
);

/* ─────────────────────────────────────────────────────────
   MIRROR
   Oval frame, wall bracket
───────────────────────────────────────────────────────── */
const MirrorIcon = makeIcon(
  <>
    {/* frame */}
    <ellipse cx="12" cy="13" rx="7" ry="9" />
    {/* inner reflection line */}
    <path d="M9 10a4 4 0 0 1 3-2" strokeOpacity="0.4" />
    {/* wall hook */}
    <path d="M12 4V2" />
  </>,
  "MirrorIcon",
);

/* ─────────────────────────────────────────────────────────
   PLANT / VASE
   Round pot, stem, leaf pair
───────────────────────────────────────────────────────── */
const PlantIcon = makeIcon(
  <>
    {/* pot */}
    <path d="M8 18h8l-1-4H9l-1 4z" />
    {/* stem */}
    <path d="M12 14v-5" />
    {/* left leaf */}
    <path d="M12 12 C10 10 7 10 7 7 C10 7 12 9 12 12z" />
    {/* right leaf */}
    <path d="M12 10 C14 8 17 8 17 5 C14 5 12 7 12 10z" />
    {/* saucer */}
    <path d="M7 18.5h10" />
  </>,
  "PlantIcon",
);

/* ─────────────────────────────────────────────────────────
   ARTWORK / PICTURE FRAME
   Rectangle frame, landscape scene inside
───────────────────────────────────────────────────────── */
const ArtworkIcon = makeIcon(
  <>
    {/* outer frame */}
    <rect x="3" y="4" width="18" height="16" rx="1" />
    {/* inner mount */}
    <rect x="5.5" y="6.5" width="13" height="11" rx="0.5" />
    {/* horizon line */}
    <path d="M5.5 14h13" />
    {/* sun */}
    <circle cx="15" cy="11" r="1.5" />
  </>,
  "ArtworkIcon",
);

/* ─────────────────────────────────────────────────────────
   CURTAIN / DRAPE
   Rod, two gathered panels
───────────────────────────────────────────────────────── */
const CurtainIcon = makeIcon(
  <>
    {/* rod */}
    <path d="M2 4h20" />
    {/* finials */}
    <circle cx="2" cy="4" r="1" />
    <circle cx="22" cy="4" r="1" />
    {/* left panel gathered */}
    <path d="M4 4 C5 8 4 12 6 16 C7 18 6 20 7 22" />
    <path d="M8 4 C7 8 8 12 6 16" />
    {/* right panel gathered */}
    <path d="M20 4 C19 8 20 12 18 16 C17 18 18 20 17 22" />
    <path d="M16 4 C17 8 16 12 18 16" />
  </>,
  "CurtainIcon",
);

/* ─────────────────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────────────────── */
export {
  ArmchairIcon,
  ArtworkIcon,
  BedIcon,
  BookshelfIcon,
  CoffeeTableIcon,
  ConsoleTableIcon,
  CurtainIcon,
  DiningChairIcon,
  DiningTableIcon,
  FloorLampIcon,
  MirrorIcon,
  PendantLampIcon,
  PlantIcon,
  RugIcon,
  SideTableIcon,
  SofaIcon,
  WardrobeIcon,
};
