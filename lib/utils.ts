import { clsx, type ClassValue } from "clsx";
import { Prisma } from "@prisma/client";
import { twMerge } from "tailwind-merge";

export type SerializedPrisma<T> =
  T extends Prisma.Decimal ? string
  : T extends Date ? string
  : T extends Array<infer U> ? SerializedPrisma<U>[]
  : T extends object ? { [K in keyof T]: SerializedPrisma<T[K]> }
  : T;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function serializePrismaData<T>(data: T): SerializedPrisma<T> {
  if (data == null) {
    return data as SerializedPrisma<T>;
  }

  if (data instanceof Prisma.Decimal) {
    return data.toString() as SerializedPrisma<T>;
  }

  if (data instanceof Date) {
    return data.toISOString() as SerializedPrisma<T>;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializePrismaData(item)) as SerializedPrisma<T>;
  }

  if (typeof data === "object") {
    const serializedEntries = Object.entries(data).map(([key, value]) => [
      key,
      serializePrismaData(value)
    ]);

    return Object.fromEntries(serializedEntries) as SerializedPrisma<T>;
  }

  return data as SerializedPrisma<T>;
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function buildBarcode(prefix = "REP", seed?: number) {
  const number = seed ?? Math.floor(Math.random() * 99999) + 1;
  return `${prefix}-${number.toString().padStart(5, "0")}`;
}
