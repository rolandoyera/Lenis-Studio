"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="group-data-[collapsible=icon]:p-0.5!">
              <Link prefetch={false} href="/dashboard/home">
                <Image
                  src={APP_CONFIG.image.src}
                  alt="Logo"
                  width={isCollapsed ? 26 : 24}
                  height={isCollapsed ? 26 : 24}
                  style={{ width: isCollapsed ? 26 : 24, height: isCollapsed ? 26 : 24 }}
                  className="transition-all duration-200 dark:invert"
                />
                <span className="font-semibold font-serif text-2xl text-black dark:text-white">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
    </Sidebar>
  );
}
