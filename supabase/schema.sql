create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('Peptides', 'Accessoires', 'Packs', 'Nutrition')),
  price numeric not null default 0 check (price >= 0),
  old_price numeric check (old_price is null or old_price >= 0),
  unit text not null,
  rating numeric check (rating is null or rating >= 0),
  stock text not null default 'in-stock' check (stock in ('in-stock', 'preorder', 'notify')),
  description text not null,
  image text,
  badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'cancelled')),
  payment_method text not null default 'whatsapp' check (payment_method in ('whatsapp')),
  customer jsonb not null,
  subtotal numeric not null default 0 check (subtotal >= 0),
  shipping numeric not null default 0 check (shipping >= 0),
  total numeric not null default 0 check (total >= 0)
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  unit text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  price numeric not null default 0 check (price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
