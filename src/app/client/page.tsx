import type { Metadata } from "next";
import { AppShell, Panel } from "@/components/AppShell";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { setMyBarber, updateMyDetails } from "@/app/actions/client";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import { brand, telHref } from "@/lib/shop";

export const metadata: Metadata = { title: "My account | Golden Era Barbershop" };

const solidButton =
  "rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink-2";
const outlineButton =
  "rounded-full border border-line px-4 py-2 text-xs font-semibold transition hover:border-ink";

function mapsUrl(shop: Tables<"shops">) {
  const q = encodeURIComponent(`${brand.name}, ${shop.street}, ${shop.city}, ${shop.region} ${shop.postal_code}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// Book / call / Instagram links for one barber. Booking pages are each
// barber's own (theCut, Booksy…), so they open in a new tab.
function BarberLinks({ barber, primary = false }: { barber: Tables<"barbers">; primary?: boolean }) {
  return (
    <>
      {barber.booking_url && (
        <a
          href={barber.booking_url}
          target="_blank"
          rel="noopener noreferrer"
          className={primary ? solidButton : outlineButton}
        >
          Book
        </a>
      )}
      {barber.phone && (
        <a href={telHref(barber.phone)} className={outlineButton}>
          Call
        </a>
      )}
      {barber.instagram && (
        <a
          href={`https://instagram.com/${barber.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className={outlineButton}
        >
          Instagram
        </a>
      )}
    </>
  );
}

export default async function ClientPage() {
  const viewer = await requireRole("client");
  const supabase = await createClient();
  const [{ data: shops }, { data: barbers }] = await Promise.all([
    supabase.from("shops").select("*").order("sort"),
    supabase.from("barbers").select("*").eq("active", true).order("sort").order("display_name"),
  ]);
  const allShops = shops ?? [];
  const allBarbers = barbers ?? [];
  // A hidden barber drops out of the list, so a saved pick can go stale.
  const mine = allBarbers.find((b) => b.id === viewer.profile.favorite_barber_id) ?? null;
  const myShop = mine ? allShops.find((s) => s.id === mine.shop_id) : null;
  const firstName = viewer.profile.full_name?.split(" ")[0];

  return (
    <AppShell viewer={viewer}>
      <h1 className="font-display text-4xl font-semibold uppercase tracking-wide sm:text-5xl">
        {firstName ? `Hey, ${firstName}` : "My account"}
      </h1>
      <p className="mt-1 text-ink-2">Book your next cut with Golden Era.</p>

      <div className="mt-8 space-y-6">
        <Panel title="My barber">
          {mine ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-display text-3xl font-semibold uppercase tracking-wide">{mine.display_name}</p>
                <p className="text-sm text-muted">
                  Golden Era {myShop?.name}
                  {mine.specialty && ` · ${mine.specialty}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BarberLinks barber={mine} primary />
                <form action={setMyBarber.bind(null, null)}>
                  <button className="px-2 text-xs font-semibold text-muted underline hover:text-ink">Change</button>
                </form>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-2">
              Pick your go-to barber below and they&rsquo;ll show up here, ready to book.
            </p>
          )}
        </Panel>

        <Panel title="Barbers">
          <div className="space-y-8">
            {allShops.map((shop) => {
              const seats = allBarbers.filter((b) => b.shop_id === shop.id);
              return (
                <div key={shop.id}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">{shop.name}</h3>
                    <p className="text-xs text-muted">
                      <a href={mapsUrl(shop)} target="_blank" rel="noopener noreferrer" className="underline">
                        {shop.street}, {shop.city}
                      </a>
                      {shop.hours && ` · ${shop.hours}`}
                    </p>
                  </div>
                  {seats.length === 0 ? (
                    <p className="text-sm text-muted">No barbers listed yet.</p>
                  ) : (
                    <ul className="divide-y divide-line rounded-2xl border border-line">
                      {seats.map((b) => (
                        <li key={b.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                          <div className="min-w-0 sm:flex-1">
                            <p className="font-semibold">{b.display_name}</p>
                            {b.specialty && <p className="text-xs text-muted">{b.specialty}</p>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <BarberLinks barber={b} />
                            {b.id === mine?.id ? (
                              <span className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-paper">
                                My barber
                              </span>
                            ) : (
                              <form action={setMyBarber.bind(null, b.id)}>
                                <button className={outlineButton}>Make my barber</button>
                              </form>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="My details">
          <ActionForm action={updateMyDetails} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="full_name" autoComplete="name" defaultValue={viewer.profile.full_name} required />
            <Field label="Phone" name="phone" type="tel" autoComplete="tel" defaultValue={viewer.profile.phone} />
            <p className="text-sm text-muted sm:col-span-2">Email: {viewer.email}</p>
            <div className="sm:col-span-2">
              <SubmitButton>Save</SubmitButton>
            </div>
          </ActionForm>
        </Panel>
      </div>
    </AppShell>
  );
}
