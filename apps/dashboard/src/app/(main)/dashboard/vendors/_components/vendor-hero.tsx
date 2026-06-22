"use client";

import { Tag } from "lucide-react";

import { DashboardImage } from "@/components/dashboard-image";
import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  PinterestIcon,
  XTwitterIcon,
  YoutubeIcon,
} from "@/components/icons/icons";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { H1 } from "@/components/ui/typography";
import type { Vendor } from "@/lib/types";

import { vendorGradient } from "./vendor-gradient";
import { getDisplayUrl, getVendorSocialHrefs } from "./vendor-links";

interface VendorHeroProps {
  vendor: Vendor;
}

export function VendorHero({ vendor }: VendorHeroProps) {
  const gradient = vendorGradient(vendor.name);
  const {
    websiteHref,
    instagramHref,
    pinterestHref,
    facebookHref,
    youtubeHref,
    xTwitterHref,
  } = getVendorSocialHrefs(vendor);

  return (
    <Card className="overflow-hidden pt-0">
      {/* Banner: hero image → gradient fallback */}
      <div className="relative flex h-90 w-full items-end overflow-hidden">
        {vendor.heroImageUrl ? (
          <DashboardImage
            src={vendor.heroImageUrl}
            alt={`${vendor.name} banner`}
            sizes="(min-width: 1024px) 75vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-linear-to-br ${gradient}`} />
        )}
        <div className="absolute inset-0 bg-black/20" />
        {vendor.description && (
          <div className="absolute bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-white/10 bg-black/50 p-4 text-white shadow-lg backdrop-blur-md">
            <p className="mb-1 font-bold text-[10px] text-white/50 uppercase tracking-wider">
              About
            </p>
            <p className="line-clamp-4 text-white/90 text-xs leading-relaxed">
              {vendor.description}
            </p>
          </div>
        )}
      </div>

      {/* Name row */}
      <CardContent className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-5">
            <H1>{vendor.name}</H1>
            {vendor.logoUrl && (
              <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-background shadow-xs">
                <DashboardImage
                  src={vendor.logoUrl}
                  alt={vendor.name}
                  sizes="32px"
                  className="object-contain"
                />
              </div>
            )}
          </div>
          <div>
            {vendor.category && (
              <div className="flex items-center gap-1.5">
                <Tag className="size-2.5 text-primary" />
                <Label> {vendor.category}</Label>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-center text-muted-foreground h-14">
        <div className="flex h-6 items-center gap-3">
          {websiteHref ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.currentTarget.blur()}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-primary">
                  <GlobeIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>{getDisplayUrl(websiteHref)}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="cursor-not-allowed text-muted-foreground/20">
              <GlobeIcon />
            </span>
          )}
          {instagramHref ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.currentTarget.blur()}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-primary">
                  <InstagramIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>{getDisplayUrl(instagramHref)}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="cursor-not-allowed text-muted-foreground/20">
              <InstagramIcon />
            </span>
          )}
          {pinterestHref ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={pinterestHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.currentTarget.blur()}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-primary">
                  <PinterestIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>{getDisplayUrl(pinterestHref)}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="cursor-not-allowed text-muted-foreground/20">
              <PinterestIcon />
            </span>
          )}
          {facebookHref ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.currentTarget.blur()}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-primary">
                  <FacebookIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>{getDisplayUrl(facebookHref)}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="cursor-not-allowed text-muted-foreground/20">
              <FacebookIcon />
            </span>
          )}
          {youtubeHref ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={youtubeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.currentTarget.blur()}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-primary">
                  <YoutubeIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>{getDisplayUrl(youtubeHref)}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="cursor-not-allowed text-muted-foreground/20">
              <YoutubeIcon />
            </span>
          )}
          {xTwitterHref ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={xTwitterHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.currentTarget.blur()}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-primary">
                  <XTwitterIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>{getDisplayUrl(xTwitterHref)}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="cursor-not-allowed text-muted-foreground/20">
              <XTwitterIcon />
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
