"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type PushPermission = "granted" | "denied" | "default" | "unsupported";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export function usePushNotifications(firebaseUid: string | null | undefined) {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Check current state on mount
  useEffect(() => {
    if (!firebaseUid) {
      setIsLoading(false);
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission as PushPermission);

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        registrationRef.current = registration;

        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error("Error checking push subscription:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [firebaseUid]);

  const subscribe = useCallback(async () => {
    if (!firebaseUid) return false;

    try {
      setIsLoading(true);

      // Register service worker if not already
      let registration = registrationRef.current;
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
        registrationRef.current = registration;
      }

      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);

      if (result !== "granted") {
        setIsLoading(false);
        return false;
      }

      // Subscribe to push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not configured");
        setIsLoading(false);
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid,
          subscription: subscription.toJSON(),
        }),
      });

      if (res.ok) {
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (err) {
      console.error("Error subscribing to push:", err);
      setIsLoading(false);
      return false;
    }
  }, [firebaseUid]);

  const unsubscribe = useCallback(async () => {
    if (!firebaseUid) return;

    try {
      setIsLoading(true);

      const registration = registrationRef.current;
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Remove from server
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebaseUid, endpoint }),
        });
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("Error unsubscribing from push:", err);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUid]);

  return {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
