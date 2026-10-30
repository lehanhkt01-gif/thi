// src/app/api/auth/google/config/route.ts - Trả về Client ID cho Google Identity Services nếu có
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  return NextResponse.json({
    clientId,
    isConfigured: !!clientId,
  });
}
