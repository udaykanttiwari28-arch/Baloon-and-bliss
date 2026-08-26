create extension if not exists pgcrypto;

create type public.booking_status as enum ('New', 'Contacted', 'Confirmed', 'Cancelled');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  sku text not null unique,
  base_price_minor integer not null check (base_price_minor >= 0),
  currency text not null default 'SGD' check (currency = 'SGD'),
  tags text[] not null default '{}',
  included_items text[] not null default '{}',
  highlight_label text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price_minor integer not null default 0 check (price_minor >= 0),
  currency text not null default 'SGD' check (currency = 'SGD'),
  is_required boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.add_ons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price_minor integer not null default 0 check (price_minor >= 0),
  currency text not null default 'SGD' check (currency = 'SGD'),
  price_on_request boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_add_ons (
  product_id uuid not null references public.products(id) on delete cascade,
  add_on_id uuid not null references public.add_ons(id) on delete cascade,
  primary key (product_id, add_on_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  mobile text not null,
  whatsapp_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  venue text not null,
  postal_code text not null,
  special_requirements text,
  items_total_minor integer not null check (items_total_minor >= 0),
  delivery_total_minor integer not null default 0 check (delivery_total_minor >= 0),
  setup_total_minor integer not null default 0 check (setup_total_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  currency text not null default 'SGD' check (currency = 'SGD'),
  status public.booking_status not null default 'New',
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_end_after_start check (end_time > start_time)
);

create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  unit_price_minor integer not null check (unit_price_minor >= 0),
  quantity integer not null check (quantity > 0),
  line_total_minor integer not null check (line_total_minor >= 0),
  created_at timestamptz not null default now()
);

create table public.booking_item_options (
  booking_item_id uuid not null references public.booking_items(id) on delete cascade,
  option_id uuid not null references public.product_options(id) on delete restrict,
  option_name text not null,
  price_minor integer not null check (price_minor >= 0),
  primary key (booking_item_id, option_id)
);

create table public.booking_item_add_ons (
  booking_item_id uuid not null references public.booking_items(id) on delete cascade,
  add_on_id uuid not null references public.add_ons(id) on delete restrict,
  add_on_name text not null,
  price_minor integer not null check (price_minor >= 0),
  primary key (booking_item_id, add_on_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['categories','products','product_options','add_ons','customers','bookings'] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.add_ons enable row level security;
alter table public.product_add_ons enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.booking_item_options enable row level security;
alter table public.booking_item_add_ons enable row level security;
alter table public.audit_logs enable row level security;

create policy "public read active categories" on public.categories for select using (is_active);
create policy "public read active products" on public.products for select using (is_active);
create policy "public read product images" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and p.is_active)
);
create policy "public read active product options" on public.product_options for select using (
  is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active)
);
create policy "public read active add-ons" on public.add_ons for select using (is_active);
create policy "public read product add-ons" on public.product_add_ons for select using (
  exists (select 1 from public.products p where p.id = product_id and p.is_active)
);

-- Booking creation and admin writes go through validated server-side endpoints.
