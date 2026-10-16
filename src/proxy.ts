import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that read the session. The landing page and static files skip it.
  matcher: ["/dashboard/:path*", "/owner/:path*", "/barber/:path*", "/client/:path*", "/join/:path*", "/login", "/signup"],
};
