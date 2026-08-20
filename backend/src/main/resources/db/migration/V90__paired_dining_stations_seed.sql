alter table table_kits add column if not exists dining_table_id uuid references dining_tables(id);

update table_kits k
set dining_table_id = t.id
from dining_tables t
where k.dining_table_id is null and k.code = t.code;

create unique index if not exists ux_table_kits_dining_table_id
  on table_kits(dining_table_id) where dining_table_id is not null;

insert into dining_tables(name, code, area, active)
values
  ('Salão 01', 'SALAO-01', 'SALÃO', true),
  ('Sala 01', 'SALA-01', 'SALA', true),
  ('Jardim 01', 'JARDIM-01', 'JARDIM', true)
on conflict (code) do nothing;

insert into table_kits(
  name, code, qr_token, qr_short_token, status, light_state, active,
  device_id, installed_by_staff, dining_table_id
)
select
  seed.name,
  seed.code,
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16)),
  'AVAILABLE',
  'OFF',
  true,
  seed.device_id,
  seed.installed_by_staff,
  (select id from dining_tables where code = seed.code)
from (values
  ('Kit Salão 01', 'SALAO-01', 'TORRE-SALAO-01', 'RODRIGO'),
  ('Kit Sala 01', 'SALA-01', 'TORRE-SALA-01', 'NATHAN'),
  ('Kit Jardim 01', 'JARDIM-01', 'TORRE-JARDIM-01', 'RODRIGO')
) as seed(name, code, device_id, installed_by_staff)
on conflict (code) do update set
  dining_table_id = excluded.dining_table_id,
  installed_by_staff = excluded.installed_by_staff,
  device_id = excluded.device_id;
