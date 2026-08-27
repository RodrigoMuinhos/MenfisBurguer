alter table webhook_events
  add column if not exists status text,
  add column if not exists received_at timestamptz not null default now(),
  add column if not exists processing_started_at timestamptz,
  add column if not exists attempts integer not null default 0,
  add column if not exists next_retry_at timestamptz,
  add column if not exists last_error text,
  add column if not exists resource_id text;

-- Registros anteriores eram gravados apenas quando considerados deduplicados.
update webhook_events set status = 'PROCESSED' where status is null;

alter table webhook_events
  alter column status set default 'RECEIVED',
  alter column status set not null,
  alter column processed_at drop not null,
  alter column processed_at drop default;

alter table webhook_events
  drop constraint if exists webhook_events_status_check;

alter table webhook_events
  add constraint webhook_events_status_check
  check (status in ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED'));

create index if not exists idx_webhook_events_retry
  on webhook_events(next_retry_at)
  where status in ('RECEIVED', 'FAILED');

