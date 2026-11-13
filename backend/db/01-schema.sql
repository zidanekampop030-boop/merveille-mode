-- Merveille Mode & Élégance — schéma PostgreSQL 16
-- Exécuté automatiquement à la première création du conteneur (docker-entrypoint-initdb.d).

create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text,                     -- null pour un compte créé via Google
  google_sub    text unique,              -- identifiant Google (claim "sub")
  name          text not null default '',
  role          text not null default 'customer' check (role in ('customer', 'admin')),
  avatar_url    text,
  created_at    timestamptz not null default now(),
  check (password_hash is not null or google_sub is not null)
);
create unique index users_email_lower_idx on users (lower(email));

create table products (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  description text not null default '',
  category    text not null check (category in ('chaussures', 'vetements', 'sacs', 'perruques', 'accessoires', 'beaute')),
  price       integer not null check (price > 0),
  promo_price integer check (promo_price is null or (promo_price > 0 and promo_price < price)),
  images      text[] not null default '{}',
  is_new      boolean not null default false,
  preview     boolean not null default false,  -- visible sans compte
  published   boolean not null default true,
  stock       integer not null default 0 check (stock >= 0),
  sizes       text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_catalog_idx on products (created_at desc) where published;
create index products_category_idx on products (category);
