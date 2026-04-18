import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@/services/user-service";

export async function GET() {
  const status = await checkDatabaseConnection();
  return NextResponse.json(status, { status: status.ok ? 200 : 500 });
}
