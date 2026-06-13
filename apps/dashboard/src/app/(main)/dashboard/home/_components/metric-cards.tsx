"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ArrowRight, DollarSign, TrendingDown, TrendingUp, UserPlus, Users, Waves } from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjects } from "@/lib/db";
import type { Project } from "@/lib/types";

export function MetricCards() {
  const { profile, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      setLoadingProjects(false);
      return;
    }

    let isMounted = true;
    const orgId = profile.organizationId;

    async function loadProjects() {
      setLoadingProjects(true);
      setProjectsError(false);

      try {
        const data = await getProjects(orgId);
        if (isMounted) {
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard projects:", error);
        if (isMounted) {
          setProjectsError(true);
        }
      } finally {
        if (isMounted) {
          setLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [profile, authLoading]);

  const activeProjectCount = projects.filter((project) => project.status === "Active").length;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <DollarSign className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Total Revenue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">$100,250</div>
          </div>
          <p className="text-muted-foreground text-sm">Last 90 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <UserPlus className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>New Customers</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">1,234</div>
            <Badge variant="destructive">
              <TrendingDown className="size-3" />
              -20%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Acquisition needs attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Users className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Active Projects</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {loadingProjects ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
                {activeProjectCount.toLocaleString()}
              </div>
            )}
          </div>
          {loadingProjects ? (
            <Skeleton className="h-5 w-28" />
          ) : projectsError ? (
            <div className="flex h-5 items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">Unable to load projects</p>
              <Link
                href="/dashboard/projects"
                prefetch={false}
                className="flex items-center gap-1 font-medium text-primary text-sm"
              >
                View projects
                <ArrowRight className="size-3" />
              </Link>
            </div>
          ) : (
            <div className="flex h-5 ml-auto">

              <Link
                href="/dashboard/projects"
                prefetch={false}
                className="flex items-center gap-1 font-medium text-primary text-sm"
              >
                <Button variant="link">View projects   <ArrowRight className="size-3" /></Button>
              
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Waves className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Growth Rate</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">4.5%</div>
            <Badge>
              <TrendingUp className="size-3" />
              +4.5%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Meets growth projections</p>
        </CardContent>
      </Card>
    </div>
  );
}
