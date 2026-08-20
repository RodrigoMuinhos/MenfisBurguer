alter table table_kits add column if not exists qr_short_token text;

update table_kits
set qr_short_token = left(qr_token, 16)
where qr_short_token is null;

alter table table_kits alter column qr_short_token set not null;
create unique index if not exists ux_table_kits_qr_short_token on table_kits(qr_short_token);

alter table table_kits add constraint ck_table_kits_qr_short_token_length
  check (char_length(qr_short_token) = 16);
