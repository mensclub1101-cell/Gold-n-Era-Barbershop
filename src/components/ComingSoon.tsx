import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

// Simple centered message screen: auth placeholders and the 404 page.
export function ComingSoon({ title, body, eyebrow = "Coming soon" }: { title: string; body: string; eyebrow?: string }) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="w-full max-w-md rounded-3xl border border-line p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">{title}</h1>
          <p className="mt-4 text-ink-2">{body}</p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wider text-paper transition hover:bg-ink-2"
          >
            Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
