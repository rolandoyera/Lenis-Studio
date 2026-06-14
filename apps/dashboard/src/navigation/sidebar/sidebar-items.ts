import {
  Activity,
  Building2,
  Calendar,
  ChartBar,
  Cog,
  FolderKanban,
  Forklift,
  Gauge,
  Globe,
  GraduationCap,
  Hammer,
  Kanban,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  ReceiptText,
  ShoppingBag,
  Users,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
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
        title: "Marketing",
        url: "/dashboard/marketing",
        icon: Megaphone,
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
        title: "Website",
        url: "/dashboard/coming-soon",
        icon: Globe,
        comingSoon: true,
      },
      {
        title: "Calendar",
        url: "/dashboard/coming-soon",
        icon: Calendar,
        comingSoon: true,
      },
      {
        title: "Kanban",
        url: "/dashboard/coming-soon",
        icon: Kanban,
        comingSoon: true,
      },
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
    ],
  },
];
