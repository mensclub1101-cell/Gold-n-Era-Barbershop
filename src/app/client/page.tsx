import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Account | Golden Era Barbershop" };

// Client accounts are the next phase; this keeps the role routing complete.
export default async function ClientPage() {
  const viewer = await requireRole("client");
  return (
    <AppShell viewer={viewer}>
      <div className="mx-auto max-w-md rounded-3xl border border-line p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Coming soon</p>
        <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">Your account</h1>
        <p className="mt-4 text-ink-2">
          Client accounts are on the way. For now, book with your barber from the home page.
        </p>
        <Link
          href="/#staff"
          className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wider text-paper transition hover:bg-ink-2"
        >
          Find your barber
        </Link>
      </div>
    </AppShell>
  );
}
