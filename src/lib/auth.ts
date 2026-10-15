import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Tables } from "@/lib/database.types";

export type Viewer = {
  userId: string;
  email: string | null;
  profile: Tables<"profiles">;
  // The barber seat this account claimed, if any. An owner can have one too.
  seat: Tables<"barbers"> | null;
};

export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const [{ data: profile }, { data: seat }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("barbers").select("*").eq("profile_id", userId).maybeSingle(),
  ]);
  if (!profile) return null;

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { userId, email, profile, seat };
}

export function homeFor(role: AppRole) {
  if (role === "owner") return "/owner";
  if (role === "barber") return "/barber";
  return "/client";
}

// Gate a page to the given roles. Signed-out visitors go to login; signed-in
// users with another role go to their own home.
export async function requireRole(...roles: AppRole[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!roles.includes(viewer.profile.role)) redirect(homeFor(viewer.profile.role));
  return viewer;
}

// Only allow same-site relative paths as post-login destinations.
export function safeNext(next: unknown): string | null {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
}
