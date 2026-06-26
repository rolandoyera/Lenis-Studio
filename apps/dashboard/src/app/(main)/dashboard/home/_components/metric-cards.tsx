"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Display,
  DisplayContent,
  DisplayFooter,
  DisplayHeader,
  DisplayIcon,
  DisplayTitle,
} from "@/components/ui/display";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjects } from "@/lib/db";
import type { Project } from "@/lib/types";
import { InstagramIcon } from "@/components/icons/icons";
import { Label } from "@/components/ui/label";
import { fetchInstagramFollowers, type KpiMetric } from "@/server/meta-actions";

export function MetricCards() {
  const { organizationId, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState(false);
  const [igFollowers, setIgFollowers] = useState<{
    followers: number;
    comparison: KpiMetric | null;
  } | null>(null);
  const [igLoading, setIgLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!organizationId) {
      setLoadingProjects(false);
      return;
    }

    let isMounted = true;
    const orgId = organizationId; // stable string dependency; profile object identity churns on each heartbeat

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
  }, [organizationId, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    // Presence gate only: a profile is only ever set with an organizationId, so
    // keying on organizationId is equivalent and avoids refetching on each heartbeat.
    if (!organizationId) {
      setIgLoading(false);
      return;
    }

    let isMounted = true;
    setIgLoading(true);

    fetchInstagramFollowers()
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setIgFollowers(res.data);
        }
      })
      .catch((error) => {
        console.error("Failed to load Instagram followers:", error);
      })
      .finally(() => {
        if (isMounted) setIgLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [organizationId, authLoading]);

  const activeProjectCount = projects.filter(
    (project) => project.status === "in_progress",
  ).length;
  const projectStatus = loadingProjects
    ? "loading"
    : projectsError
      ? "error"
      : "ready";

  return (
    <div className="grid grid-cols-1 gap-6 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card>
        <CardHeader className="flex items-center gap-4">
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <DollarSign className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Total Revenue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              $100,250
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Last 90 days</p>
        </CardContent>
      </Card>

      <Display>
        <DisplayHeader>
          <DisplayIcon>
            <UserPlus className="size-4" />
          </DisplayIcon>
          <DisplayTitle>New Leads</DisplayTitle>
        </DisplayHeader>

        <DisplayContent>
          <div className="flex flex-wrap items-center gap-6 pl-11">
            {projectStatus === "loading" ? (
              <>
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-5 w-28" />
              </>
            ) : projectStatus === "error" ? (
              <div className="flex h-5 items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                  Unable to load leads
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
                  {activeProjectCount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </DisplayContent>

        <DisplayFooter>
          <Button
            variant="link"
            size="sm"
            asChild
            className="ml-auto p-0 detail-link"
          >
            <Link
              href="/dashboard/instagram"
              prefetch={false}
              className="group/btn flex items-center gap-0.5"
            >
              View Leads
              <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </DisplayFooter>
      </Display>

      <Display>
        <DisplayHeader>
          <DisplayIcon>
            <Users className="size-4" />
          </DisplayIcon>
          <DisplayTitle>Active Projects</DisplayTitle>
        </DisplayHeader>

        <DisplayContent>
          <div className="flex flex-wrap items-center gap-6 pl-11">
            {projectStatus === "loading" ? (
              <>
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-5 w-28" />
              </>
            ) : projectStatus === "error" ? (
              <div className="flex h-5 items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                  Unable to load projects
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
                  {activeProjectCount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </DisplayContent>

        <DisplayFooter>
          <Button
            variant="link"
            size="sm"
            asChild
            className="ml-auto p-0 detail-link"
          >
            <Link
              href="/dashboard/instagram"
              prefetch={false}
              className="group/btn flex items-center gap-0.5"
            >
              View Projects
              <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </DisplayFooter>
      </Display>

      {(igLoading || igFollowers) && (
        <Display>
          <DisplayHeader>
            <DisplayIcon>
              <InstagramIcon size={20} strokeWidth={1.5} />
            </DisplayIcon>
            <DisplayTitle>Instagram Followers</DisplayTitle>
          </DisplayHeader>

          <DisplayContent>
            <div className="flex flex-wrap items-center gap-6 pl-11">
              {igLoading || !igFollowers ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
                  {igFollowers.followers.toLocaleString()}
                </div>
              )}
              {!igLoading && igFollowers?.comparison ? (
                Number.parseFloat(igFollowers.comparison.change) === 0 ? (
                  <span className="text-muted-foreground text-sm">
                    No change
                  </span>
                ) : (
                  <Badge
                    variant={
                      igFollowers.comparison.isPositive
                        ? "trendingUp"
                        : "trendingDown"
                    }
                  >
                    {igFollowers.comparison.isPositive ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {igFollowers.comparison.change}
                  </Badge>
                )
              ) : null}
            </div>
          </DisplayContent>

          <DisplayFooter className="justify-between">
            <Label>
              {igFollowers?.comparison ? (
                <>
                  vs{" "}
                  <span className="text-base text-card-foreground">
                    {igFollowers.comparison.previousValue.toLocaleString()}
                  </span>{" "}
                  Previous 30 Days
                </>
              ) : (
                "Last 30 days"
              )}
            </Label>
            <Button
              variant="link"
              size="sm"
              asChild
              className="ml-auto p-0 detail-link"
            >
              <Link
                href="/dashboard/instagram"
                prefetch={false}
                className="group/btn flex items-center gap-0.5"
              >
                View More
                <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </Button>
          </DisplayFooter>
        </Display>
      )}
    </div>
  );
}
