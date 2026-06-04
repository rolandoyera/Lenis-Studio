import {
  Activity,
  Banknote,
  Building2,
  Calendar,
  ChartBar,
  FolderKanban,
  Forklift,
  Gauge,
  Globe,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  ListTodo,
  type LucideIcon,
  MessageSquare,
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
        title: "Finance",
        url: "/dashboard/finance",
        icon: Banknote,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: Gauge,
      },
      {
        title: "Productivity",
        url: "/dashboard/productivity",
        icon: ListTodo,
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
        title: "Chat",
        url: "/dashboard/coming-soon",
        icon: MessageSquare,
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
        title: "Invoice",
        url: "/dashboard/coming-soon",
        icon: ReceiptText,
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
    ],
  },
];
