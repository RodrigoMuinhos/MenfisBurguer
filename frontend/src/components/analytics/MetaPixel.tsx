"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PIXEL_ID = "1451662243464965";
const INTERNAL_ROUTES = ["/adm", "/kds", "/notas", "/entrega", "/relatorios"];

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    __menfisMetaLastPath?: string;
  }
}

export function MetaPixel() {
  const pathname = usePathname();
  const internal = INTERNAL_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    if (internal || !window.fbq || window.__menfisMetaLastPath === pathname) return;
    window.fbq("track", "PageView");
    window.__menfisMetaLastPath = pathname;
  }, [internal, pathname]);

  return (
    !internal ? (
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          style={{ display: "none" }}
        />
      </noscript>
    ) : null
  );
}
