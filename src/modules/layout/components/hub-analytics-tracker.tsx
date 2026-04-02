"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  trackPageView,
  trackPerformanceSample,
} from "@/shared/lib/analytics/client";

function buildTrackedPath(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

export function HubAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPathRef = useRef<string | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    const nextPath = buildTrackedPath(pathname, search);

    if (lastTrackedPathRef.current === nextPath) {
      return;
    }

    lastTrackedPathRef.current = nextPath;
    trackPageView(nextPath);

    const timeoutId = window.setTimeout(() => {
      trackPerformanceSample(nextPath);
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, search]);

  return null;
}

