"use client";

import { Image, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { LibraryItem } from "@/lib/types";

interface ItemGalleryCardProps {
  item: LibraryItem;
  activeImage: string;
  onSelectImage: (url: string) => void;
}

/** Sourcing gallery: large active preview plus a clickable thumbnail strip. */
export function ItemGalleryCard({ item, activeImage, onSelectImage }: ItemGalleryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        {activeImage === item.coverImageUrl && activeImage && (
          <Badge className="flex items-center gap-2 bg-black/55 text-white uppercase backdrop-blur-xs">
            <Image className="size-2.5 text-yellow-500" />
            Primary Cover
          </Badge>
        )}
      </CardHeader>
      <CardContent className="relative flex aspect-16/14.5 w-full items-center justify-center">
        {activeImage ? (
          <img src={activeImage} alt={item.name} className="absolute inset-0 size-full object-contain px-2" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground/30">
            <ShoppingBag className="size-16" />
            <p className="text-xs uppercase tracking-wider">No photos uploaded</p>
          </div>
        )}
      </CardContent>

      {item.imageUrls && item.imageUrls.length > 0 && (
        <CardFooter>
          <div className="flex flex-wrap gap-4">
            {item.imageUrls.map((url) => (
              <button
                key={url}
                type="button"
                className={`relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-md border transition-all ${
                  activeImage === url
                    ? "scale-105 border-primary ring-2 ring-primary/20"
                    : "border-border/60 hover:border-border"
                }`}
                onClick={() => onSelectImage(url)}
              >
                <img src={url} alt="thumbnail" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
