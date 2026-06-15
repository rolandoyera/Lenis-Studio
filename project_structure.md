# Project Structure & Folder Tree

This document provides a comprehensive overview of the directory tree and file architecture of the Lenis Studio (formerly Sarvian Design Group / SDG) workspace.

---

## Workspace Directory Tree

```text
Lenis-Studio/ (Workspace Root)
├── .vscode/                           # IDE configurations
├── apps/                              # Monorepo Workspace Applications
│   ├── website/                       # Next.js Website App (Public Facing)
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
│   ├── dashboard/                     # Next.js Admin Dashboard Application
│   │   ├── package.json               # Dashboard application dependencies and scripts
│   │   ├── tsconfig.json              # TypeScript compiler settings
│   │   ├── components.json            # Shadcn UI components configuration
│   │   ├── biome.json                 # Biome configuration for formatting and linting
│   │   └── src/                       # Dashboard source code
│   │       ├── app/                   # Next.js App Router (main, external routes, layouts, views)
│   │       ├── components/            # Shadcn & custom React UI components
│   │       ├── config/                # Dashboard theme presets and app config definitions
│   │       ├── data/                  # Mock data for dashboards
│   │       ├── hooks/                 # Reusable custom React hooks
│   │       ├── lib/                   # Global utilities, phone formatters, and font configurations
│   │       ├── navigation/            # Navigation structure and sidebar definitions
│   │       ├── scripts/               # Boot scripts (preventing theme/layout flicker)
│   │       ├── server/                # Next.js server actions/server-only utilities
│   │       ├── stores/                # Zustand client state management stores
│   │       ├── styles/                # CSS themes and presets styling definitions
│   │       └── types/                 # Custom type definitions
│   ├── Image_structure_and_deletion.md # Design image asset mapping specification
│   └── Image_structure_and_deletion_review.md # Feedback & reviews on image asset handling
├── AGENTS.md                          # CRM AI Development Rules (instructions & validation guidelines)
├── GEMINI.md                          # CRM AI Development Rules specifically configured for Gemini
├── Issues.md                          # Log of system issues, bugs, and resolution states
├── Library_Form.md                    # Specifications for libraries and dashboard library forms
├── Proposal_Page.md                   # Feature proposal and details
├── Selections_Page.md                 # Design selections flow and pages documentation
├── ThingsToFix.md                     # Priority visual and structural tweaks tracker
├── ThisToDO.md                        # Active backlog tasks checklist
├── ai_autofill_architecture.md        # Architecture overview of the CRM AI auto-fill forms system
├── project_structure.md               # Folder tree and architecture overview (this file)
├── saas_architecture.md               # Monorepo SaaS subscription and portal blueprint
└── vendor_image_mirroring_plan.md     # Architecture plan for downloading and serving vendor assets
```

---

## Key Modules & Core Refactoring Highlights

### 1. Unified Font Registry & CSS Loading
Extends `next/font/google` with a single source of truth in [registry.ts](file:///c:/Users/rolys/Web/Lenis-Studio/apps/dashboard/src/lib/fonts/registry.ts). Automatically generates and bundles font CSS variables (like `--font-inter`, `--font-lora`, etc.) inside `fontVars`, which gets loaded globally in the root layout to avoid layout shift. Integrates custom CSS rules dynamically into the user's Preferences store.

### 2. ViewTransitions-Driven Auth & Landing Layout
Leverages Next.js View Transitions in [page.tsx](file:///c:/Users/rolys/Web/Lenis-Studio/apps/dashboard/src/app/%28external%29/page.tsx) and [layout.tsx](file:///c:/Users/rolys/Web/Lenis-Studio/apps/dashboard/src/app/%28main%29/auth/layout.tsx) to achieve smooth, hardware-accelerated animated transitions when entering the login flow. Seamlessly shares brand and backdrop components across routes using page transitions.

### 3. The Inquiry Routing System (`/api/contact/route.ts` - Website)
Distinguishes client payloads cleanly using the `source` parameter:
* **Website Contact Form** (`source: "contact"`): Triggers customized email copy, subject lines (`New Website Inquiry`), and is triggered by submissions in the slide-out Contact Drawer or general pages.
* **Website Project Form** (`source: "project"`): Tracks high-value project inquiries, triggering corresponding project leads subject lines, and is submitted through the Project Inquiry Modal.

### 4. Standalone Contact Drawer (`ContactDrawerContent.tsx` - Website)
Extracted from `Navbar2.tsx` to dramatically simplify the main navigation. Self-encapsulates the Zod schema validation, default form states, hidden anti-bot honeypots, dynamic render-time bot traps, visual layouts, and successful conversion message views.
