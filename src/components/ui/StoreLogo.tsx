"use client";

import { useState } from "react";

interface StoreLogoProps {
  store: string;
  logoUrl: string | null;
  size?: number;
  imgClassName?: string;
  fallbackClassName?: string;
}

export default function StoreLogo({
  store,
  logoUrl,
  size = 40,
  imgClassName = "object-contain w-full h-full",
  fallbackClassName = "",
}: StoreLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = store.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || store.slice(0, 2).toUpperCase();

  if (!logoUrl || failed) {
    return <span className={fallbackClassName}>{initials}</span>;
  }

  return (
    <img
      src={logoUrl}
      alt={store}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={imgClassName}
    />
  );
}
