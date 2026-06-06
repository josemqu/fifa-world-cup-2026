"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends an activity event to the backend analytics endpoint.
 * Fire-and-forget: errors are silently swallowed so they never
 * disrupt the user experience.
 */
export async function trackEvent(
  firebaseUid: string,
  action: string,
  metadata?: Record<string, any>
) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebaseUid, action, metadata }),
    });
  } catch {
    // Silently ignore tracking errors
  }
}

/**
 * Hook that automatically tracks PAGE_VIEW events whenever the
 * current route changes. Should be called from a top-level component
 * that has access to the authenticated user.
 */
export function useActivityTracker(firebaseUid: string | null | undefined) {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!firebaseUid || !pathname) return;

    // Avoid double-tracking the same path (StrictMode protection)
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Skip admin pages from tracking to avoid noise
    if (pathname.startsWith("/admin")) return;

    trackEvent(firebaseUid, "PAGE_VIEW", { path: pathname });
  }, [firebaseUid, pathname]);
}
