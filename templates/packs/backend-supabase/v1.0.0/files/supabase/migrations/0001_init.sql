-- Example initial migration
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create index if not exists items_created_at_idx on items (created_at desc);

