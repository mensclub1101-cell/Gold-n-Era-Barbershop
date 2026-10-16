-- Client accounts: a client can save "my barber" and give a phone at signup.

alter table public.profiles
  add column favorite_barber_id uuid references public.barbers (id) on delete set null;
create index profiles_favorite_barber_id_idx on public.profiles (favorite_barber_id);

grant update (favorite_barber_id) on public.profiles to authenticated;

-- Signup may also carry a phone number. Role still never comes from metadata.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
