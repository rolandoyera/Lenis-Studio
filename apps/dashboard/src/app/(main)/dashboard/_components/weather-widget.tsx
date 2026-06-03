"use client";

import { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from "@/lib/firebase";
import { getWeatherForLocation } from "@/server/weather-actions";

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
  };
  current: {
    temp_f: number;
    temp_c: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
    };
  };
}

/**
 * Client-Side Weather Widget: Fetches the user's Firestore ZIP code,
 * executes the secure server weather action, and displays the real-time temperature,
 * condition condition icon, and city. Fail-safe: hides completely if key/API is down.
 */
export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Fetch user location ZIP from Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          let userLocation = "10001"; // Fallback default zip (New York)

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.location && data.location.trim() !== "") {
              userLocation = data.location.trim();
            }
          }

          // 2. Query secure Server Action for current weather
          const res = await getWeatherForLocation(userLocation);
          if (res.success && res.data) {
            setWeather(res.data);
          } else {
            setErrorMsg(res.error || "Failed to load weather.");
          }
        } catch (err: unknown) {
          console.error("[WeatherWidget] Error loading weather details:", err);
          setErrorMsg("Could not access weather service.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-11 w-44 items-center gap-2.5 rounded-xl border border-border/40 bg-card/45 px-3 py-1.5 backdrop-blur-xs shadow-xs">
        <Skeleton className="size-7.5 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-2 w-20" />
        </div>
      </div>
    );
  }

  // Gracefully fail-safe: hide if not configured, or if key limits are reached
  if (errorMsg || !weather) {
    if (process.env.NODE_ENV === "development" && errorMsg) {
      return (
        <div className="flex h-11 items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-[10px] text-destructive backdrop-blur-xs shadow-xs max-w-xs shrink-0 select-none">
          <span>Weather API: {errorMsg}</span>
        </div>
      );
    }
    return null;
  }

  // Prefix protocol to weatherapi cdn links if needed
  const iconUrl = weather.current.condition.icon.startsWith("//")
    ? `https:${weather.current.condition.icon}`
    : weather.current.condition.icon;

  const temp = Math.round(weather.current.temp_f);
  const isDay = weather.current.is_day;
  let conditionText = weather.current.condition.text;
  if (isDay === 0 && conditionText.toLowerCase() === "sunny") {
    conditionText = "Clear";
  }
  const cityName = weather.location.name;

  return (
    <div
      title={`Current weather in ${cityName}: ${conditionText}`}
      className="flex items-center px-3 py-1 text-sm text-card-foreground shrink-0 select-none font-normal tracking-normal normal-case"
    >
      <img
        src={iconUrl}
        alt={conditionText}
        className="size-14 object-contain drop-shadow-xs shrink-0"
        draggable={false}
      />
      <div className="flex flex-col text-left leading-normal min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl text-foreground leading-none">{temp}°F</span>
          <span className="text-muted-foreground text-xs max-w-[80px] font-light leading-none truncate">
            {conditionText}
          </span>
        </div>
        <Label className="mt-0.5 tracking-normal text-xs">{cityName}</Label>
      </div>
    </div>
  );
}
