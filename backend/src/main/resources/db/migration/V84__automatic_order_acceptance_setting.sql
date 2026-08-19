insert into app_settings(key, value, updated_at)
values ('automatic_order_acceptance_enabled', 'false', now())
on conflict (key) do nothing;
