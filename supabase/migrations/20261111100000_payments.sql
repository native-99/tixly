-- Payments (Midtrans) + ticket email delivery.
--
-- The browser never sees a payment server key: payment intents are created by the
-- `create-payment` Edge Function and confirmed by the `midtrans-webhook` function.
-- Both talk to Postgres through the functions below, which are service-role only.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.orders
  add column payment_provider text,
  add column payment_ref text,
  add column payment_url text,
  add column tickets_emailed_at timestamptz;

-- A gateway reference can only belong to one order.
create unique index orders_payment_ref_key
  on public.orders (payment_provider, payment_ref)
  where payment_ref is not null;

-- ---------------------------------------------------------------------------
-- Gateway notifications (idempotency log)
-- ---------------------------------------------------------------------------

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  -- transaction_id + status, so a retry of the same notification is ignored
  -- but a later status change (pending -> settlement) is still recorded.
  external_id text not null,
  order_id uuid references public.orders (id) on delete cascade,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  unique (provider, external_id)
);

create index payment_events_order_idx on public.payment_events (order_id, received_at desc);

alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Resolve an order from a gateway reference. Midtrans order ids are
-- "<order uuid>-<attempt timestamp>", so fall back to the uuid prefix.
create or replace function public.order_id_for_payment(p_provider text, p_ref text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select o.id from public.orders o
      where o.payment_provider = p_provider and o.payment_ref = p_ref
      limit 1
    ),
    (
      select o.id from public.orders o
      where o.id::text = left(p_ref, 36)
      limit 1
    )
  );
$$;

revoke execute on function public.order_id_for_payment(text, text) from anon, authenticated;
grant execute on function public.order_id_for_payment(text, text) to service_role;

-- Returns true the first time a notification is seen, false on a retry.
create or replace function public.claim_payment_event(
  p_provider text,
  p_external_id text,
  p_order_id uuid,
  p_status text,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted integer;
begin
  insert into public.payment_events (provider, external_id, order_id, status, payload)
  values (p_provider, p_external_id, p_order_id, p_status, p_payload)
  on conflict (provider, external_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted > 0;
end;
$$;

revoke execute on function public.claim_payment_event(text, text, uuid, text, jsonb) from anon, authenticated;
grant execute on function public.claim_payment_event(text, text, uuid, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Marking an order paid (webhook path)
-- ---------------------------------------------------------------------------

create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_provider text,
  p_ref text,
  p_payload jsonb default '{}'::jsonb
)
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
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND: Order not found.';
  end if;

  -- A retried webhook is a no-op, not a second set of tickets.
  if v_order.status = 'paid' then
    return public.order_json(v_order.id);
  end if;

  -- Paid after the hold expired: quota may already be resold. Keep the money
  -- recorded on the payment event and let the organizer refund it by hand.
  if v_order.status <> 'pending' then
    return jsonb_build_object(
      'status', 'late_payment',
      'order', public.order_json(v_order.id)
    );
  end if;

  update public.orders
  set
    status = 'paid',
    paid_at = now(),
    payment_provider = coalesce(p_provider, payment_provider),
    payment_ref = coalesce(p_ref, payment_ref)
  where id = v_order.id;

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

revoke execute on function public.mark_order_paid(uuid, text, text, jsonb) from anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Email payload
-- ---------------------------------------------------------------------------

create or replace function public.ticket_email_payload(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'orderId', o.id,
    'buyerName', p.full_name,
    'buyerEmail', p.email,
    'emailedAt', o.tickets_emailed_at,
    'event', jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'venue', e.venue,
      'city', e.city,
      'startsAt', e.starts_at
    ),
    'tickets', coalesce((
      select jsonb_agg(
        jsonb_build_object('code', t.code, 'ticketTypeName', tt.name)
        order by t.code
      )
      from public.tickets t
      join public.ticket_types tt on tt.id = t.ticket_type_id
      where t.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  join public.profiles p on p.id = o.buyer_id
  join public.events e on e.id = o.event_id
  where o.id = p_order_id;
$$;

revoke execute on function public.ticket_email_payload(uuid) from anon, authenticated;
grant execute on function public.ticket_email_payload(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Housekeeping
-- ---------------------------------------------------------------------------

-- Pending orders hold quota only until expires_at. Availability already ignores
-- stale holds; this function tidies the rows so "expired" is visible in the UI.
create or replace function public.expire_pending_orders()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.orders
  set status = 'expired'
  where status = 'pending' and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.expire_pending_orders() from anon, authenticated;
grant execute on function public.expire_pending_orders() to service_role;

-- Run it every minute. Local and cloud both ship pg_cron; skip quietly when a
-- fork of Postgres doesn't, so migrations never fail over an optional feature.
do $$
begin
  create extension if not exists pg_cron with schema extensions;
  perform cron.schedule('tixly-expire-holds', '* * * * *', 'select public.expire_pending_orders()');
exception
  when others then
    raise notice 'pg_cron not available, expire_pending_orders must be scheduled elsewhere: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Simulated payments keep working (mock/demo mode)
-- ---------------------------------------------------------------------------

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

  update public.orders
  set
    status = 'paid',
    paid_at = now(),
    payment_provider = 'simulated',
    payment_ref = 'sim-' || v_order.id::text
  where id = v_order.id;

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

-- ---------------------------------------------------------------------------
-- order_json: expose payment fields
-- ---------------------------------------------------------------------------

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
    'paymentProvider', o.payment_provider,
    'paymentUrl', o.payment_url,
    'ticketsEmailedAt', o.tickets_emailed_at,
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
