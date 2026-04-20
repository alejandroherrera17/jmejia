import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { assertModuleAccess, isForbiddenError } from "@/lib/permissions";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export async function POST(request: Request) {
  try {
    await assertModuleAccess("inventory", ["ADMIN", "BODEGUERO"]);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibio ningun archivo." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "La imagen supera el limite de 4 MB." }, { status: 400 });
    }

    const extension = allowedTypes.get(file.type);

    if (!extension) {
      return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDirectory = path.join(process.cwd(), "public", "uploads", "products");
    const fileName = `${randomUUID()}.${extension}`;

    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(path.join(uploadsDirectory, fileName), buffer);

    return NextResponse.json({
      url: `/uploads/products/${fileName}`
    });
  } catch (error) {
    if (isForbiddenError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    throw error;
  }
}
