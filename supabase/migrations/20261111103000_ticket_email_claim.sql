-- Exactly one email per order, even when the webhook and the checkout page
-- race each other. The sender claims the row first, then sends; a failed send
-- releases the claim so it can be retried.

create or replace function public.claim_ticket_email(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated integer;
begin
  update public.orders
  set tickets_emailed_at = now()
  where id = p_order_id and tickets_emailed_at is null;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function public.release_ticket_email(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.orders set tickets_emailed_at = null where id = p_order_id;
end;
$$;

revoke execute on function public.claim_ticket_email(uuid) from anon, authenticated;
revoke execute on function public.release_ticket_email(uuid) from anon, authenticated;
grant execute on function public.claim_ticket_email(uuid) to service_role;
grant execute on function public.release_ticket_email(uuid) to service_role;
