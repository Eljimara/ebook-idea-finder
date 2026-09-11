-- A executer dans Supabase > SQL Editor

create table if not exists idees (
  id uuid primary key default gen_random_uuid(),
  univers_id uuid references univers(id) on delete set null,
  texte text not null,
  source text,
  mot_cle text,
  statut text not null default 'a_explorer' check (statut in ('a_explorer', 'en_cours', 'publie')),
  created_at timestamptz not null default now()
);

-- Empeche les doublons exacts (meme texte, insensible a la casse, pour le meme univers ;
-- univers_id nul = un seul "bucket" partage pour les idees issues d'un mot-cle libre).
create unique index if not exists idees_unique_texte_par_univers
  on idees (coalesce(univers_id::text, ''), lower(texte));
