"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { resolveDeepLinkPath } from "@/lib/mobile/deepLinks";

/**
 * Mounted once at the root layout (see app/layout.tsx via Providers.tsx).
 * A complete no-op on the regular website and installed PWA —
 * Capacitor.isNativePlatform() is only ever true inside the native
 * Android/iOS shell (capacitor.config.ts's remote-URL mode loads this same
 * Next.js app there, so this one component covers both platforms). Inside
 * the shell, it:
 *
 *  - marks <html> with a `native-app` class (globals.css scopes the
 *    bottom safe-area padding to it, so the web/PWA layout is untouched),
 *  - sets the status bar's steady-state style/color and hides the native
 *    splash screen once this (post-hydration) effect actually runs — the
 *    splash stays up for however long the WebView takes to load and
 *    render the real page, never a fixed timer racing against a slow
 *    connection,
 *  - lets Android's hardware/gesture back button drive the in-app router
 *    instead of the WebView's own (unrelated) navigation history,
 *  - listens for `appUrlOpen` (deep links — both the custom `menorah://`
 *    scheme and, once the well-known domain-verification files are in
 *    place, Universal/App Links — see lib/mobile/deepLinks.ts and
 *    MOBILE_SETUP.md) and forwards them to the Next.js router.
 */
export default function NativeAppBootstrap() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add("native-app");

    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#080d22" }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    SplashScreen.hide().catch(() => {});

    const backButtonHandle = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        router.back();
      } else {
        CapacitorApp.exitApp();
      }
    });

    const urlOpenHandle = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      const path = resolveDeepLinkPath(url);
      if (path) router.push(path);
    });

    return () => {
      backButtonHandle.then((handle) => handle.remove());
      urlOpenHandle.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
}
