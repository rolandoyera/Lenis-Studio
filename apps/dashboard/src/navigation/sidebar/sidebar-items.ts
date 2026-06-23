import {
  Activity,
  Building2,
  ChartBar,
  Cog,
  FileSignature,
  FileText,
  FolderKanban,
  Forklift,
  Gauge,
  GraduationCap,
  Hammer,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
  ShoppingBag,
  UserPlus,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

import { InstagramIcon } from "@/components/icons/icons";

/** Sidebar icons can be lucide icons or our custom SVG icon components. */
type NavIcon = LucideIcon | ComponentType<{ className?: string }>;

export interface NavSubItem {
  title: string;
  url: string;
  icon?: NavIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: NavIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  /** Opt this link into Next route prefetch (off by default for the rest of the nav). */
  prefetch?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        title: "Home",
        url: "/dashboard/home",
        icon: LayoutDashboard,
      },
      {
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
      {
        title: "Instagram",
        url: "/dashboard/instagram",
        icon: InstagramIcon,
        // Warm the page (and the cached post URLs) on hover so it opens instantly.
        prefetch: true,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: Gauge,
      },
      {
        title: "E-commerce",
        url: "/dashboard/ecommerce",
        icon: ShoppingBag,
      },
      {
        title: "Academy",
        url: "/dashboard/academy",
        icon: GraduationCap,
        isNew: true,
      },
    ],
  },
  {
    id: 2,
    label: "Design Studio",
    items: [
      {
        title: "Projects",
        url: "/dashboard/projects",
        icon: FolderKanban,
      },
      {
        title: "Library",
        url: "/dashboard/library",
        icon: ShoppingBag,
      },
      {
        title: "Leads",
        url: "/dashboard/leads",
        icon: UserPlus,
      },
      {
        title: "Clients",
        url: "/dashboard/clients",
        icon: Users,
      },
      {
        title: "Vendors",
        url: "/dashboard/vendors",
        icon: Forklift,
      },
      {
        title: "Trades",
        url: "/dashboard/trades",
        icon: Hammer,
      },
      {
        title: "Proposals",
        url: "/dashboard/proposals",
        icon: ReceiptText,
      },
      {
        title: "Contracts",
        url: "/dashboard/contracts",
        icon: FileSignature,
        isNew: true,
      },
      {
        title: "AI Diagnostics",
        url: "/dashboard/diagnostics",
        icon: Activity,
      },
    ],
  },
  {
    id: 3,
    label: "Pages",
    items: [
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
      },
      {
        title: "Tenants",
        url: "/dashboard/tenants",
        icon: Building2,
      },
      {
        title: "Company",
        url: "/dashboard/company",
        icon: Cog,
      },
      {
        title: "Docs",
        url: "/dashboard/docs",
        icon: FileText,
      },
    ],
  },
];
