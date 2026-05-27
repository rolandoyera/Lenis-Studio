# Project Structure & Folder Tree

This document provides a comprehensive overview of the directory tree and file architecture of the Sarvian Design Group (SDG) workspace.

---

## Workspace Directory Tree

```text
SDG/ (Workspace Root)
├── .vscode/                           # IDE configurations
├── apps/                              # Monorepo Workspace Applications
│   ├── website/                       # Next.js Sarvian Design Group Website App
│   │   ├── .env.local                 # Local environment credentials (Brevo, Sanity)
│   │   ├── next.config.ts             # Next.js build configurations
│   │   ├── package.json               # Website application dependencies and scripts
│   │   ├── tsconfig.json              # TypeScript compiler settings
│   │   ├── public/                    # Website static assets (about, slider, projects, etc.)
│   │   └── src/                       # Website source code
│   │       ├── app/                   # App Router pages (about, Press, projects, api/contact, theme, etc.)
│   │       ├── components/            # UI components (atoms, icons, navigation navbar2/contact drawer)
│   │       ├── lib/                   # CN / helper utilities
│   │       └── sanity/                # Sanity CMS config & schemas
│   └── dashboard/                     # Next.js Admin Dashboard Application (cloned template)
│       ├── package.json               # Dashboard application dependencies and scripts
│       ├── tsconfig.json              # TypeScript compiler settings
│       ├── components.json            # Shadcn UI components configuration
│       ├── biome.json                 # Biome configuration for formatting and linting
│       ├── src/                       # Dashboard source code
│       │   ├── app/                   # Next.js App Router (main, external routes, layout, global styles)
│       │   ├── components/            # Shadcn & custom React UI components
│       │   ├── config/                # Dashboard theme presets and custom presets config
│       │   ├── data/                  # Mock data for dashboards
│       │   ├── hooks/                 # Reusable custom React hooks
│       │   ├── lib/                   # Global utilities (CN class merger, base configurations)
│       │   ├── navigation/            # Navigation structure and definitions
│       │   ├── server/                # Next.js server actions/server-only utilities
│       │   ├── stores/                # Zustand client state management stores
│       │   └── styles/                # CSS themes and presets styling definitions
├── project_structure.md               # Folder tree and architecture overview (this file)
└── theme_guidelines.md                # General website UI guidelines & colors
```

---

## Key Modules & Core Refactoring Highlights

### 1. The Inquiry Routing System (`/api/contact/route.ts`)
Distinguishes client payloads cleanly using the `source` parameter:
* **Website Contact Form** (`source: "contact"`): Triggers customized email copy, subject lines (`New Website Inquiry`), and is triggered by submissions in the slide-out Contact Drawer or general pages.
* **Website Project Form** (`source: "project"`): Tracks high-value project inquiries, triggering corresponding project leads subject lines, and is submitted through the Project Inquiry Modal.

### 2. Standalone Contact Drawer (`ContactDrawerContent.tsx`)
Extracted from `Navbar2.tsx` to dramatically simplify the main navigation. Self-encapsulates the Zod schema validation, default form states, hidden anti-bot honeypots, dynamic render-time bot traps, visual layouts, and successful conversion message views.

### 3. Full-Screen Parallax Hero Cover (`about/page.tsx`)
A completely redesigned editorial page. Utilizes full-bleed, dynamic parallax vertical transitions shifted via hardware-accelerated `translate3d(0, y, 0)` triggers behind a fixed transparent navbar. Completed with an elegant Tailwind v4 linear bottom-weighted gradient overlay (`bg-linear-to-t`) that ensures maximum legibility for the overlayed text copy.
