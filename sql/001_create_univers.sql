-- A executer dans Supabase > SQL Editor

create extension if not exists "pgcrypto";

create table if not exists univers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  created_at timestamptz not null default now()
);
