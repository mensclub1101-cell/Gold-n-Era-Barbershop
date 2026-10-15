import { redirect } from "next/navigation";
import { getViewer, homeFor } from "@/lib/auth";

// One entry point after login: send each role to its own home.
export default async function DashboardPage() {
  const viewer = await getViewer();
  redirect(viewer ? homeFor(viewer.profile.role) : "/login");
}
