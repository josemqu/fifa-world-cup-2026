"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { GoogleAuthProvider } from "firebase/auth";
import Script from "next/script";

export function GoogleOneTap() {
  const { user, loading, loginWithCredential } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    // Si el usuario ya está logueado o está cargando, no mostramos One Tap
    if (user || loading || initialized.current) return;

    const handleCredentialResponse = async (response: any) => {
      try {
        const idToken = response.credential;
        const credential = GoogleAuthProvider.credential(idToken);
        await loginWithCredential(credential);
        // Sesión iniciada correctamente

      } catch (error) {
        console.error("Error al iniciar sesión con Google One Tap:", error);
      }
    };

    const initializeOneTap = () => {
      // Necesitamos el Client ID de Google. 
      // Si no está en el env, One Tap no funcionará.
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        console.warn("Google One Tap: NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado.");
        return;
      }

      if (window.google && !initialized.current && !user) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          window.google.accounts.id.prompt((notification: any) => {
            // Los logs de estado se manejan silenciosamente

          });
          
          initialized.current = true;
        } catch (error) {
          console.error("Error al inicializar Google One Tap:", error);
        }
      }
    };

    // Verificamos si window.google está disponible
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeOneTap();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, loading, loginWithCredential]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
    </>
  );
}

// Añadimos el tipo global para window.google
declare global {
  interface Window {
    google: any;
  }
}
