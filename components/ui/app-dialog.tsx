"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border/70 bg-card px-6 py-5">
          <div className="space-y-1">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar ventana"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
