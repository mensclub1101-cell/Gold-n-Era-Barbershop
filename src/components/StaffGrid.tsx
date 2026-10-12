"use client";

import { useState } from "react";
import { barbers, locations, locationName } from "@/lib/shop";

const tabs = [{ slug: "all", name: "All" }, ...locations.map((l) => ({ slug: l.slug, name: l.name }))];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StaffGrid() {
  const [active, setActive] = useState("all");
  const shown = active === "all" ? barbers : barbers.filter((b) => b.location === active);

  return (
    <div>
      <div role="tablist" aria-label="Filter barbers by location" className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.slug}
            role="tab"
            aria-selected={active === t.slug}
            onClick={() => setActive(t.slug)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active === t.slug
                ? "border-ink bg-ink text-paper"
                : "border-line bg-paper text-ink hover:border-ink"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((b) => (
          <li
            key={b.name}
            className="group flex flex-col rounded-2xl border border-line bg-paper p-6 transition hover:border-ink"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-semibold tracking-wider text-paper">
                {initials(b.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-medium uppercase tracking-wide">{b.name}</p>
                <p className="text-sm text-muted">{locationName(b.location)}</p>
              </div>
              {b.sample && (
                <span className="ml-auto rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Sample
                </span>
              )}
            </div>
            <p className="mt-4 text-sm text-ink-2">{b.specialty}</p>
            <button
              disabled
              className="mt-6 rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink opacity-60"
              title="Online booking opens soon"
            >
              Booking opens soon
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
