-- Order history for the buyer's "Orders" page.
--
-- One row per order with just enough event data for the list, so the page never
-- has to join tables on the client (RLS on `events` is fine, but this keeps it
-- to one round trip).

create or replace function public.list_my_orders()
returns table (
  id uuid,
  event_id uuid,
  status text,
  total integer,
  expires_at timestamptz,
  created_at timestamptz,
  paid_at timestamptz,
  tickets_emailed_at timestamptz,
  event_title text,
  event_venue text,
  event_city text,
  event_starts_at timestamptz,
  event_poster_url text,
  event_category text,
  ticket_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    o.id,
    o.event_id,
    case
      when o.status = 'pending' and o.expires_at <= now() then 'expired'
      else o.status::text
    end,
    o.total,
    o.expires_at,
    o.created_at,
    o.paid_at,
    o.tickets_emailed_at,
    e.title,
    e.venue,
    e.city,
    e.starts_at,
    e.poster_url,
    e.category,
    (select count(*) from public.tickets t where t.order_id = o.id)
  from public.orders o
  join public.events e on e.id = o.event_id
  where o.buyer_id = auth.uid()
  order by o.created_at desc;
$$;

grant execute on function public.list_my_orders() to authenticated;
