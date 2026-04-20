"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function ClientDate({
  value,
  className,
  loading = null,
  options
}: Readonly<{
  value: string | Date;
  className?: string;
  loading?: React.ReactNode;
  options?: Intl.DateTimeFormatOptions;
}>) {
  const [mounted, setMounted] = useState(false);
  const date = new Date(value);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || Number.isNaN(date.getTime())) {
    return loading;
  }

  const formattedDate = date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options
  });

  return (
    <time className={cn(className)} dateTime={date.toISOString()}>
      {formattedDate}
    </time>
  );
}
