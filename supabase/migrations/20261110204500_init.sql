-- Tixly schema: profiles, events, ticket types, orders and tickets.
-- Reads that need aggregates go through security-definer functions below,
-- so table RLS can stay strict.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('buyer', 'organizer', 'staff');
create type public.event_status as enum ('draft', 'published');
create type public.event_category as enum ('festival', 'music', 'comedy', 'meetup', 'sports', 'arts');
create type public.order_status as enum ('pending', 'paid', 'expired', 'cancelled');
create type public.ticket_status as enum ('issued', 'checked_in');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'buyer',
  -- Staff only: the organizer whose events this gate can check in.
  organizer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  -- Defaults to the signed-in organizer, so an insert can't target someone else.
  organizer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  category public.event_category not null default 'festival',
  venue text not null,
  city text not null,
  starts_at timestamptz not null,
  poster_url text,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index events_status_starts_at_idx on public.events (status, starts_at);
create index events_organizer_idx on public.events (organizer_id, starts_at);

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  price integer not null check (price >= 0),
  quota integer not null check (quota > 0)
);

create index ticket_types_event_idx on public.ticket_types (event_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  status public.order_status not null default 'pending',
  total integer not null default 0 check (total >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index orders_event_idx on public.orders (event_id);
create index orders_pending_expiry_idx on public.orders (expires_at) where status = 'pending';

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0)
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_ticket_type_idx on public.order_items (ticket_type_id);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique,
  status public.ticket_status not null default 'issued',
  issued_at timestamptz not null default now(),
  checked_in_at timestamptz
);

create index tickets_owner_idx on public.tickets (owner_id);
create index tickets_event_idx on public.tickets (event_id);
create index tickets_code_idx on public.tickets (upper(code));

-- ---------------------------------------------------------------------------
-- Profile creation trigger
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.owns_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.events
    where id = p_event_id and organizer_id = auth.uid()
  );
$$;

-- Remaining quota = quota - (paid + unexpired pending orders).
create or replace function public.ticket_type_remaining(p_ticket_type_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select greatest(
    tt.quota - coalesce((
      select sum(oi.quantity)::integer
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.ticket_type_id = tt.id
        and (o.status = 'paid' or (o.status = 'pending' and o.expires_at > now()))
    ), 0),
    0
  )
  from public.ticket_types tt
  where tt.id = p_ticket_type_id;
$$;

revoke execute on function public.ticket_type_remaining(uuid) from anon, authenticated;

-- A quota can't drop below what is already sold or on hold. Keeping the rule
-- in the database means every client is bound by it.
create or replace function public.ticket_types_guard_quota()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_taken integer;
begin
  select coalesce(sum(oi.quantity), 0)::integer into v_taken
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.ticket_type_id = new.id
    and (o.status = 'paid' or (o.status = 'pending' and o.expires_at > now()));

  if new.quota < v_taken then
    raise exception using
      errcode = 'P0001',
      message = 'VALIDATION: Quota can''t be lower than the ' || v_taken || ' tickets already sold or on hold.';
  end if;

  return new;
end;
$$;

create trigger ticket_types_quota_guard
  before update of quota on public.ticket_types
  for each row execute function public.ticket_types_guard_quota();

create or replace function public.order_json(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', o.id,
    'buyerId', o.buyer_id,
    'eventId', o.event_id,
    'status', case
      when o.status = 'pending' and o.expires_at <= now() then 'expired'
      else o.status::text
    end,
    'total', o.total,
    'expiresAt', o.expires_at,
    'createdAt', o.created_at,
    'paidAt', o.paid_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'ticketTypeId', oi.ticket_type_id,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price
      ) order by oi.id)
      from public.order_items oi
      where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_order_id;
$$;

revoke execute on function public.order_json(uuid) from anon, authenticated;

create or replace function public.ticket_json(p_ticket_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', t.id,
    'orderId', t.order_id,
    'eventId', t.event_id,
    'ticketTypeId', t.ticket_type_id,
    'ownerId', t.owner_id,
    'code', t.code,
    'status', t.status::text,
    'issuedAt', t.issued_at,
    'checkedInAt', t.checked_in_at,
    'ticketTypeName', tt.name,
    'event', jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'venue', e.venue,
      'city', e.city,
      'startsAt', e.starts_at
    )
  )
  from public.tickets t
  join public.ticket_types tt on tt.id = t.ticket_type_id
  join public.events e on e.id = t.event_id
  where t.id = p_ticket_id;
$$;

revoke execute on function public.ticket_json(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Read APIs
-- ---------------------------------------------------------------------------

create or replace function public.list_published_events()
returns table (
  id uuid,
  organizer_id uuid,
  title text,
  description text,
  category public.event_category,
  venue text,
  city text,
  starts_at timestamptz,
  poster_url text,
  status public.event_status,
  created_at timestamptz,
  min_price integer,
  capacity integer,
  remaining integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    e.id,
    e.organizer_id,
    e.title,
    e.description,
    e.category,
    e.venue,
    e.city,
    e.starts_at,
    e.poster_url,
    e.status,
    e.created_at,
    min(tt.price)::integer as min_price,
    coalesce(sum(tt.quota), 0)::integer as capacity,
    coalesce(sum(public.ticket_type_remaining(tt.id)), 0)::integer as remaining
  from public.events e
  left join public.ticket_types tt on tt.event_id = e.id
  where e.status = 'published'
  group by e.id
  order by e.starts_at;
$$;

grant execute on function public.list_published_events() to anon, authenticated;

create or replace function public.list_my_events()
returns table (
  id uuid,
  organizer_id uuid,
  title text,
  description text,
  category public.event_category,
  venue text,
  city text,
  starts_at timestamptz,
  poster_url text,
  status public.event_status,
  created_at timestamptz,
  min_price integer,
  capacity integer,
  remaining integer
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if public.current_user_role() is distinct from 'organizer' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN: Only organizers have events.';
  end if;

  return query
    select
      e.id,
      e.organizer_id,
      e.title,
      e.description,
      e.category,
      e.venue,
      e.city,
      e.starts_at,
      e.poster_url,
      e.status,
      e.created_at,
      min(tt.price)::integer as min_price,
      coalesce(sum(tt.quota), 0)::integer as capacity,
      coalesce(sum(public.ticket_type_remaining(tt.id)), 0)::integer as remaining
    from public.events e
    left join public.ticket_types tt on tt.event_id = e.id
    where e.organizer_id = auth.uid()
    group by e.id
    order by e.starts_at;
end;
$$;

grant execute on function public.list_my_events() to authenticated;

create or replace function public.get_event(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.events;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found then
    return null;
  end if;

  -- Drafts are visible only to their organizer.
  if v_event.status = 'draft' and (auth.uid() is null or v_event.organizer_id <> auth.uid()) then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_event.id,
    'organizerId', v_event.organizer_id,
    'title', v_event.title,
    'description', v_event.description,
    'category', v_event.category,
    'venue', v_event.venue,
    'city', v_event.city,
    'startsAt', v_event.starts_at,
    'posterUrl', v_event.poster_url,
    'status', v_event.status,
    'createdAt', v_event.created_at,
    'ticketTypes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tt.id,
        'eventId', tt.event_id,
        'name', tt.name,
        'price', tt.price,
        'quota', tt.quota,
        'remaining', public.ticket_type_remaining(tt.id)
      ) order by tt.price, tt.name)
      from public.ticket_types tt
      where tt.event_id = v_event.id
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_event(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create or replace function public.create_order(p_event_id uuid, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_buyer uuid := auth.uid();
  v_role public.user_role;
  v_event public.events;
  v_item record;
  v_ticket_type public.ticket_types;
  v_remaining integer;
  v_order_id uuid := gen_random_uuid();
  v_total integer := 0;
begin
  select role into v_role from public.profiles where id = v_buyer;
  if v_role is distinct from 'buyer' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN: Only buyers can check out.';
  end if;

  select * into v_event from public.events where id = p_event_id and status = 'published';
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND: Event not found.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = 'P0001', message = 'VALIDATION: Choose at least one ticket.';
  end if;

  insert into public.orders (id, buyer_id, event_id, status, total, expires_at)
  values (v_order_id, v_buyer, p_event_id, 'pending', 0, now() + interval '10 minutes');

  -- Lock in a stable order to avoid deadlocks between concurrent checkouts.
  for v_item in
    select
      (value ->> 'ticketTypeId')::uuid as ticket_type_id,
      sum((value ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items)
    group by 1
    order by 1
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 5 then
      raise exception using errcode = 'P0001', message = 'VALIDATION: You can buy 1 to 5 tickets per type.';
    end if;

    select * into v_ticket_type
    from public.ticket_types
    where id = v_item.ticket_type_id and event_id = p_event_id
    for update;

    if not found then
      raise exception using errcode = 'P0001', message = 'NOT_FOUND: Ticket type not found.';
    end if;

    v_remaining := public.ticket_type_remaining(v_ticket_type.id);
    if v_item.quantity > v_remaining then
      raise exception using errcode = 'P0001', message = case
        when v_remaining = 0 then 'SOLD_OUT: ' || v_ticket_type.name || ' is sold out.'
        else 'SOLD_OUT: Only ' || v_remaining || ' ' || v_ticket_type.name || ' ticket(s) left.'
      end;
    end if;

    insert into public.order_items (order_id, ticket_type_id, quantity, unit_price)
    values (v_order_id, v_ticket_type.id, v_item.quantity, v_ticket_type.price);

    v_total := v_total + (v_ticket_type.price * v_item.quantity);
  end loop;

  update public.orders set total = v_total where id = v_order_id;
  return public.order_json(v_order_id);
end;
$$;

grant execute on function public.create_order(uuid, jsonb) to authenticated;

create or replace function public.get_order(p_order_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_buyer uuid;
begin
  select buyer_id into v_buyer from public.orders where id = p_order_id;
  if v_buyer is null or v_buyer is distinct from auth.uid() then
    return null;
  end if;
  return public.order_json(p_order_id);
end;
$$;

grant execute on function public.get_order(uuid) to authenticated;

create or replace function public.pay_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_item public.order_items;
  v_index integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.buyer_id is distinct from auth.uid() then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND: Order not found.';
  end if;

  -- Paying twice is a no-op, so a double tap or retry is safe.
  if v_order.status = 'paid' then
    return public.order_json(v_order.id);
  end if;

  if v_order.status = 'pending' and v_order.expires_at <= now() then
    update public.orders set status = 'expired' where id = v_order.id;
    raise exception using errcode = 'P0001', message = 'ORDER_EXPIRED: Your hold expired. Please start checkout again.';
  end if;

  if v_order.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE: This order can no longer be paid.';
  end if;

  update public.orders set status = 'paid', paid_at = now() where id = v_order.id;

  for v_item in select * from public.order_items where order_id = v_order.id loop
    for v_index in 1..v_item.quantity loop
      insert into public.tickets (order_id, event_id, ticket_type_id, owner_id, code)
      values (
        v_order.id,
        v_order.event_id,
        v_item.ticket_type_id,
        v_order.buyer_id,
        'TX-' || upper(encode(extensions.gen_random_bytes(9), 'hex'))
      );
    end loop;
  end loop;

  return public.order_json(v_order.id);
end;
$$;

grant execute on function public.pay_order(uuid) to authenticated;

create or replace function public.cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.buyer_id is distinct from auth.uid() then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND: Order not found.';
  end if;

  if v_order.status = 'pending' and v_order.expires_at <= now() then
    update public.orders set status = 'expired' where id = v_order.id;
    raise exception using errcode = 'P0001', message = 'ORDER_EXPIRED: Your hold expired.';
  end if;

  if v_order.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'INVALID_STATE: Only unpaid orders can be cancelled.';
  end if;

  update public.orders set status = 'cancelled' where id = v_order.id;
  return public.order_json(v_order.id);
end;
$$;

grant execute on function public.cancel_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tickets
-- ---------------------------------------------------------------------------

create or replace function public.list_my_tickets()
returns table (
  id uuid,
  order_id uuid,
  event_id uuid,
  ticket_type_id uuid,
  owner_id uuid,
  code text,
  status public.ticket_status,
  issued_at timestamptz,
  checked_in_at timestamptz,
  ticket_type_name text,
  event jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    t.id,
    t.order_id,
    t.event_id,
    t.ticket_type_id,
    t.owner_id,
    t.code,
    t.status,
    t.issued_at,
    t.checked_in_at,
    tt.name,
    jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'venue', e.venue,
      'city', e.city,
      'startsAt', e.starts_at
    )
  from public.tickets t
  join public.ticket_types tt on tt.id = t.ticket_type_id
  join public.events e on e.id = t.event_id
  where t.owner_id = auth.uid()
  order by e.starts_at, t.issued_at, t.code;
$$;

grant execute on function public.list_my_tickets() to authenticated;

create or replace function public.check_in_ticket(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff public.profiles;
  v_ticket public.tickets;
  v_event public.events;
begin
  select * into v_staff from public.profiles where id = auth.uid();
  if not found or v_staff.role <> 'staff' then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN: Only gate staff can check in tickets.';
  end if;

  select * into v_ticket from public.tickets
  where upper(code) = upper(trim(p_code))
  for update;

  if not found then
    return jsonb_build_object('status', 'invalid', 'ticket', null);
  end if;

  select * into v_event from public.events where id = v_ticket.event_id;

  -- Unknown code and another organizer's ticket look the same at this gate.
  if v_event.organizer_id is distinct from v_staff.organizer_id then
    return jsonb_build_object('status', 'invalid', 'ticket', null);
  end if;

  if v_ticket.status = 'checked_in' then
    return jsonb_build_object('status', 'already_used', 'ticket', public.ticket_json(v_ticket.id));
  end if;

  update public.tickets
  set status = 'checked_in', checked_in_at = now()
  where id = v_ticket.id;

  return jsonb_build_object('status', 'valid', 'ticket', public.ticket_json(v_ticket.id));
end;
$$;

grant execute on function public.check_in_ticket(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tickets enable row level security;

-- Profiles: read and rename yourself. Role and organizer links are admin-only.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Events
create policy events_read_published on public.events
  for select to anon, authenticated
  using (status = 'published');

create policy events_read_own on public.events
  for select to authenticated
  using (organizer_id = auth.uid());

create policy events_insert_own on public.events
  for insert to authenticated
  with check (organizer_id = auth.uid() and public.current_user_role() = 'organizer');

create policy events_update_own on public.events
  for update to authenticated
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

create policy events_delete_own on public.events
  for delete to authenticated
  using (organizer_id = auth.uid());

revoke all on public.events from anon, authenticated;
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

-- Ticket types
create policy ticket_types_read on public.ticket_types
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = ticket_types.event_id
        and (e.status = 'published' or e.organizer_id = auth.uid())
    )
  );

create policy ticket_types_write on public.ticket_types
  for all to authenticated
  using (public.owns_event(event_id))
  with check (public.owns_event(event_id));

revoke all on public.ticket_types from anon, authenticated;
grant select on public.ticket_types to anon, authenticated;
grant insert, update, delete on public.ticket_types to authenticated;

-- Orders and items: read your own history. Writes go through the RPCs above.
create policy orders_read_own on public.orders
  for select to authenticated
  using (buyer_id = auth.uid());

create policy order_items_read_own on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.buyer_id = auth.uid()
    )
  );

revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;

-- Tickets: buyers see their own; organizers see tickets for their events.
create policy tickets_read on public.tickets
  for select to authenticated
  using (owner_id = auth.uid() or public.owns_event(event_id));

revoke all on public.tickets from anon, authenticated;
grant select on public.tickets to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: posters
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posters',
  'posters',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy posters_public_read on storage.objects
  for select
  using (bucket_id = 'posters');

create policy posters_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'posters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy posters_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'posters'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'posters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy posters_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'posters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
