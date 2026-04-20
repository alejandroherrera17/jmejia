"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onFileChange,
  onUrlClear,
  disabled = false
}: Readonly<{
  value?: string;
  onFileChange: (file: File | null) => void;
  onUrlClear: () => void;
  disabled?: boolean;
}>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(value ?? "");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setPreviewUrl(value ?? "");
  }, [value]);

  const hasImage = useMemo(() => Boolean(previewUrl), [previewUrl]);

  function updateFile(file: File | null) {
    onFileChange(file);

    if (!file) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="rounded-3xl border border-border/70 bg-muted/30 p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-medium">Galeria del producto</p>
        <p className="text-xs text-muted-foreground">Arrastra una imagen o selecciona un archivo.</p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          if (disabled) {
            return;
          }

          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0] ?? null;
          updateFile(file);
        }}
        className={cn(
          "group flex min-h-72 w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-card px-4 py-6 text-center transition-all",
          disabled
            ? "cursor-not-allowed opacity-70"
            : isDragging
              ? "scale-[1.01] border-primary/60 bg-primary/5"
              : "hover:border-primary/40 hover:bg-primary/5"
        )}
      >
        {hasImage ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Vista previa del producto"
              className="mx-auto h-40 w-40 rounded-[1.75rem] object-cover shadow-md"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Vista previa lista</p>
              <p className="text-xs text-muted-foreground">
                Pulsa para reemplazar o arrastra una nueva foto.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <UploadCloud className="size-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Sube la foto principal del repuesto</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG o WEBP de hasta 4 MB.</p>
            </div>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(event) => updateFile(event.target.files?.[0] ?? null)}
      />

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          Seleccionar archivo
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          disabled={disabled}
          onClick={() => {
            updateFile(null);
            onUrlClear();
          }}
        >
          <X className="size-4" />
          Limpiar
        </Button>
      </div>
    </div>
  );
}
