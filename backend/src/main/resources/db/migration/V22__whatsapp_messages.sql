create table if not exists whatsapp_conversations (
  id bigserial primary key,
  phone text not null unique,
  current_step text not null default 'INBOUND',
  last_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists whatsapp_messages (
  id bigserial primary key,
  provider_message_id text,
  phone text not null,
  direction text not null,
  message text,
  message_type text,
  status text not null default 'received',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_whatsapp_messages_provider_message_id
  on whatsapp_messages(provider_message_id)
  where provider_message_id is not null;

create index if not exists idx_whatsapp_messages_phone_created
  on whatsapp_messages(phone, created_at desc);

create index if not exists idx_whatsapp_conversations_updated
  on whatsapp_conversations(updated_at desc);
