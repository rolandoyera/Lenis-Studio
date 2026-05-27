# Sarvian Design Group (SDG) — Theme & Design System Guidelines

This document outlines the core theme tokens, styling rules, and UI components configured in the SDG application. Use these guidelines to maintain a highly premium, harmonious, and consistent visual aesthetic across all pages.

---

## 1. Typography

The typeface configuration relies on modern, elegant typography with generous sizing and light weights to convey a premium architectural feel.

- **Primary Font:** `Manrope` (Sans-serif) — used for all body text, headings, and UI controls.
- **Secondary Font (Data & Mono):** `JetBrains Mono` / `IBM Plex Mono` — used for labels, numbers, specs, and secondary metadata.
- **Base Text Color:** `Taupe 700` (`#36302a` / `hsl(36 16% 20%)`) — standard dark-brown text for high readability and premium aesthetic (never use pure black `#000`).

### Type Scale Reference

| Token / Element              | Size                                | Weight          | Line Height | Usage / Example                               |
| :--------------------------- | :---------------------------------- | :-------------- | :---------- | :-------------------------------------------- |
| **Heading 1 (`<H1>`)**       | `72px` (`text-[72px]`)              | `400` (Regular) | `1.1`       | Major page banners (e.g., "Latest Projects")  |
| **Heading 2 (`<H2>`)**       | `48px` (`text-[48px]`)              | `400` (Regular) | `1.15`      | Section headers, major text highlights        |
| **Heading 3 (`<H3>`)**       | `36px` (`text-[36px]`)              | `400` (Regular) | `1.2`       | Secondary headers (e.g., "Color Usage")       |
| **Paragraph (`<P>`)**        | `22px` (`text-base lg:text-[22px]`) | `300` (Light)   | `1.55`      | Body copy, descriptions, project summaries    |
| **Mono Text (`.font-mono`)** | `16px` (`text-[16px]`)              | `300` / `500`   | Standard    | Spec lists, technical labels, stats, captions |

---

## 2. Color Palette

The color system is heavily inspired by organic materials (cream, sand, taupe, gold) to represent architecture and interior spaces. Avoid pure blacks, pure whites, or generic bright blues/reds.

### Color Swatches Reference

```
┌──────────────────────────────────────────────────────────┐
│  CREAM GROUP (Surfaces & Backgrounds)                     │
│  Cream 100: hsl(40 60% 97%)    - bg-cream-100            │
│  Cream 200: hsl(40 40% 90%)    - bg-cream-200            │
│  Cream 300: hsl(40 30% 85%)    - bg-cream-300            │
├──────────────────────────────────────────────────────────┤
│  TAUPE GROUP (Text, Dark Surfaces, Accents)              │
│  Taupe 600: hsl(36 13% 26%)    - bg-taupe-600            │
│  Taupe 700: hsl(36 16% 20%)    - bg-taupe-700 (Base Text)│
│  Taupe 800: hsl(36 18% 15%)    - bg-taupe-800            │
│  Taupe 900: hsl(36 15% 10%)    - bg-taupe-900            │
├──────────────────────────────────────────────────────────┤
│  ACCENT / GOLD (Interactive, CTA Elements)               │
│  Accent 400: hsl(34, 34%, 48%) - bg-accent               │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Color & Layout Usage Rules

Apply these standard background and surface configurations when building pages:

### Surfaces & Containers

- **Site Canvas Background:** Always use `bg-cream-100`.
- **Cards & Content Blocks:** Use `bg-cream-200` to create subtle elevation against the site background. Optionally add a soft shadow (`shadow`) and rounded corners (`rounded` or `rounded-md`).
- **Section Dividers:** Use thin, elegant lines: `h-px bg-border/40 w-full`.

### Header & Footer Gradients

- **Header / Navigation Bar:** Use `bg-linear-to-b from-taupe-900 to-taupe-800` (transitioning from deep dark brown to dark brown).
- **Footer Container:** Use `bg-linear-to-b from-taupe-800/95 to-taupe-900`.
- **Dynamic Header Bar (Pages):** Use `bg-linear-to-b from-taupe-900 to-taupe-800` (e.g., `h-24` height to frame page starts).

---

## 4. UI Elements & Buttons

All buttons should utilize the premium `ArrowButton` component. It includes micro-animations (the arrow translates off-screen and returns on hover, and the button itself lifts up on hover).

### Arrow Button Variants

#### 1. Primary Button

- **Visuals:** Starts at Gold (`bg-accent`), transitions to Dark Taupe (`hover:bg-taupe-800`) on hover. Text color is Cream (`text-cream-100`).
- **Usage:** Core Calls-To-Action (CTAs) like "Contact", "Submit", or "Start a Project".
- **Code Example:**
  ```tsx
  <ArrowButton direction="right" variant="primary">
    Contact Us
  </ArrowButton>
  ```

#### 2. Secondary Button

- **Visuals:** Starts at Dark Taupe (`bg-taupe-800`), transitions to Gold (`hover:bg-accent`) on hover. Text color is Cream (`text-cream-100`).
- **Usage:** Navigational elements, secondary links, and gallery controls (e.g., "Next", "Previous", "View Our Projects").
- **Code Example:**
  ```tsx
  <ArrowButton direction="right" variant="secondary">
    Next Project
  </ArrowButton>
  ```

---

## 5. Development Best Practices

1. **Do not use raw hex/HSL colors in components.** Always rely on Tailwind class variables (e.g. `bg-cream-100`, `text-taupe-700`, `bg-accent`) mapped in `src/app/globals.css`.
2. **Combine typography components correctly.**
   - Use `<H1>`, `<H2>`, `<H3>`, `<H4>` and `<P>` from `@/components/ui/*` rather than raw HTML `<h1>` or `<p>`. These custom components automatically apply standard weights, leading, text-balance, and margins.
3. **Respect the Last Paragraph Margin Reset:**
   - Standard paragraphs (`<P>`) apply a default negative bottom-margin (`-mb-4`). To avoid uneven padding at the bottom of content blocks, the `<P>` component includes `last:mb-0`, which automatically resets the margin for the final paragraph in any sibling list. No manual override is needed.
