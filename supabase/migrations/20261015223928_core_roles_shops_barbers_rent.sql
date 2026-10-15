-- Golden Era core: roles, shops, barber seats, invites, booth rent.
--
-- Roles: owner, barber, client. Everyone signs up as a client; the only way to
-- become a barber or owner is to claim an invite token (claim_invite). Helper
-- functions live in the unexposed `private` schema so they can't be called
-- through the API.

create schema if not exists private;
grant usage on schema private to authenticated;

-- The auto-RLS event trigger function must not be callable through the API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create type public.app_role as enum ('owner', 'barber', 'client');

-- ---------------------------------------------------------------- tables

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  street text not null,
  city text not null,
  region text not null,
  postal_code text not null,
  phone text,
  hours text,
  photo_url text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'client',
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- A barber seat. profile_id is null until the barber claims it with an invite.
create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete restrict,
  profile_id uuid unique references public.profiles (id) on delete set null,
  display_name text not null check (length(trim(display_name)) > 0),
  specialty text,
  phone text,
  booking_url text check (booking_url is null or booking_url ~* '^https?://'),
  instagram text,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index barbers_shop_id_idx on public.barbers (shop_id);

-- Single-use invite. Barber invites point at a seat; owner invites have none.
create table public.invites (
  token text primary key default encode(extensions.gen_random_bytes(16), 'hex'),
  role public.app_role not null,
  barber_id uuid references public.barbers (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz,
  used_by uuid references public.profiles (id) on delete set null,
  constraint invites_role_seat check (
    (role = 'barber' and barber_id is not null) or (role = 'owner' and barber_id is null)
  )
);
create index invites_barber_id_idx on public.invites (barber_id);

-- Booth rent the owner charges a barber. Amounts in cents; due_date is a
-- shop-local calendar date.
create table public.rent_charges (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers (id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  due_date date not null,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index rent_charges_barber_due_idx on public.rent_charges (barber_id, due_date desc);

alter table public.shops enable row level security;
alter table public.profiles enable row level security;
alter table public.barbers enable row level security;
alter table public.invites enable row level security;
alter table public.rent_charges enable row level security;

-- ---------------------------------------------------------------- helpers

create function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'owner'
  );
$$;

create function private.my_barber_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.barbers where profile_id = (select auth.uid());
$$;

revoke execute on function private.is_owner(), private.my_barber_id() from public, anon;
grant execute on function private.is_owner(), private.my_barber_id() to authenticated;

-- Every new auth user gets a client profile. Role never comes from signup
-- metadata, so nobody can sign themselves up as an owner.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Barbers may edit their own profile fields but not which shop they're in,
-- whether they're active, their sort order or who owns the seat. Security
-- invoker on purpose: current_user is `authenticated` only for direct API
-- updates, so claim_invite (security definer) passes through.
create function private.guard_barber_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user <> 'authenticated' or private.is_owner() then
    return new;
  end if;
  if new.shop_id is distinct from old.shop_id
     or new.active is distinct from old.active
     or new.sort is distinct from old.sort
     or new.profile_id is distinct from old.profile_id then
    raise exception 'Only the owner can change shop, status, order or seat';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_barber_update() from public, anon, authenticated;

create trigger guard_barber_update
before update on public.barbers
for each row execute function private.guard_barber_update();

-- ---------------------------------------------------------------- invite RPCs

-- Public preview of an invite so the join page can say who it's for.
-- One of only two functions anon may call.
create function public.peek_invite(p_token text)
returns table (role public.app_role, display_name text, shop_name text, valid boolean)
language sql stable security definer set search_path = '' as $$
  select i.role,
         b.display_name,
         s.name,
         (i.used_at is null and i.expires_at > now()
          and (i.role = 'owner' or b.profile_id is null))
  from public.invites i
  left join public.barbers b on b.id = i.barber_id
  left join public.shops s on s.id = b.shop_id
  where i.token = p_token;
$$;
revoke execute on function public.peek_invite(text) from public;
grant execute on function public.peek_invite(text) to anon, authenticated;

-- Claim an invite for the signed-in user. Returns the user's role afterwards.
create function public.claim_invite(p_token text) returns public.app_role
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite public.invites;
  v_role public.app_role;
begin
  if v_uid is null then
    raise exception 'Sign in first';
  end if;

  select * into v_invite from public.invites where token = p_token for update;
  if not found or v_invite.used_at is not null or v_invite.expires_at <= now() then
    raise exception 'This invite link is invalid, used or expired';
  end if;

  if v_invite.role = 'owner' then
    update public.profiles set role = 'owner' where id = v_uid;
  else
    if exists (select 1 from public.barbers where profile_id = v_uid) then
      raise exception 'This account already has a barber seat';
    end if;
    update public.barbers set profile_id = v_uid
    where id = v_invite.barber_id and profile_id is null;
    if not found then
      raise exception 'This seat was already claimed';
    end if;
    -- An owner who claims a seat stays an owner.
    update public.profiles set role = 'barber' where id = v_uid and role = 'client';
  end if;

  update public.invites set used_at = now(), used_by = v_uid where token = p_token;
  select role into v_role from public.profiles where id = v_uid;
  return v_role;
end;
$$;
revoke execute on function public.claim_invite(text) from public, anon;
grant execute on function public.claim_invite(text) to authenticated;

-- ---------------------------------------------------------------- policies

-- shops: public read, owner edits contact details.
create policy shops_read on public.shops for select to anon, authenticated using (true);
create policy shops_owner_update on public.shops for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

-- profiles: you see and edit only your own. Role is not updatable (column grants).
create policy profiles_read_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- barbers: active seats are public (they're on the website); the owner and the
-- barber themselves also see inactive ones.
create policy barbers_read_public on public.barbers for select to anon, authenticated
  using (active);
create policy barbers_read_own_or_owner on public.barbers for select to authenticated
  using (profile_id = (select auth.uid()) or (select private.is_owner()));
create policy barbers_owner_insert on public.barbers for insert to authenticated
  with check ((select private.is_owner()));
create policy barbers_update_own_or_owner on public.barbers for update to authenticated
  using (profile_id = (select auth.uid()) or (select private.is_owner()))
  with check (profile_id = (select auth.uid()) or (select private.is_owner()));
create policy barbers_owner_delete on public.barbers for delete to authenticated
  using ((select private.is_owner()));

-- invites: owner only, and only barber invites. Everyone else uses the RPCs.
create policy invites_owner_read on public.invites for select to authenticated
  using ((select private.is_owner()));
create policy invites_owner_insert on public.invites for insert to authenticated
  with check ((select private.is_owner()) and role = 'barber');
create policy invites_owner_delete on public.invites for delete to authenticated
  using ((select private.is_owner()));

-- rent_charges: owner manages all; a barber reads only their own.
create policy rent_owner_all on public.rent_charges for all to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy rent_barber_read_own on public.rent_charges for select to authenticated
  using (barber_id = (select private.my_barber_id()));

-- ---------------------------------------------------------------- grants

revoke all on public.shops, public.profiles, public.barbers, public.invites, public.rent_charges
  from anon, authenticated;

grant select on public.shops, public.barbers to anon, authenticated;
grant update (phone, hours) on public.shops to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant insert, delete on public.barbers to authenticated;
grant update (display_name, specialty, phone, booking_url, instagram, active, sort, shop_id)
  on public.barbers to authenticated;
grant select, insert, delete on public.invites to authenticated;
grant select, insert, update, delete on public.rent_charges to authenticated;

-- ---------------------------------------------------------------- seed

insert into public.shops (slug, name, street, city, region, postal_code, sort) values
  ('pigeon-pass', 'Pigeon Pass', '12220 Pigeon Pass Rd B', 'Moreno Valley', 'CA', '92557', 1),
  ('moreno-beach', 'Moreno Beach', '14435 Moreno Beach Dr #105', 'Moreno Valley', 'CA', '92555', 2);

insert into public.barbers (shop_id, display_name, phone, booking_url, sort)
select s.id, v.display_name, v.phone, v.booking_url, v.sort
from (values
  ('pigeon-pass', 'Frio Fadez', '(323) 244-0211', 'https://book.thecut.co/FrioFadez', 1),
  ('pigeon-pass', 'Eshaud Gibson', '(951) 287-1258', 'https://book.thecut.co/Dro--Gibson-dgf052w', 2),
  ('pigeon-pass', 'Jonathan the Barber', '(951) 378-1206', 'https://jonathanthebarberr.booksy.com/a/', 3),
  ('pigeon-pass', 'Ramón Blendz', '(951) 705-3117', 'https://raymondbn1s.setmore.com/raymondreyes', 4),
  ('pigeon-pass', 'Norm Barber', '(323) 715-8982', 'https://book.thecut.co/AllHairNoGrease', 5),
  ('pigeon-pass', 'Jozey Barber', '(951) 419-7695', 'https://getsqr.co/jozey-the-barber-1', 6),
  ('moreno-beach', 'HarleyStylez', '(909) 653-3499', 'https://harleystylezcuts.setmore.com', 1),
  ('moreno-beach', 'Joel Barber', '(562) 619-7623', 'https://squareup.com/appointments/book/LEYATRK2XH1W1', 2),
  ('moreno-beach', 'G Blendz', '(909) 725-1741', 'https://book.thecut.co/g__blendz247', 3)
) as v (shop_slug, display_name, phone, booking_url, sort)
join public.shops s on s.slug = v.shop_slug;
