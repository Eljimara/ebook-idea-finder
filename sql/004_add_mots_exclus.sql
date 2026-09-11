-- A executer dans Supabase > SQL Editor
-- Ajoute la colonne mots_exclus (filtrage hors-sujet) sans toucher aux donnees existantes.

alter table univers add column if not exists mots_exclus text;

update univers set mots_exclus = 'wedding, ikea, microsoft, dofus, path of exile, route, metro, teams, salaire'
  where nom = 'MaraDigitalPlanner' and (mots_exclus is null or mots_exclus = '');

update univers set mots_exclus = 'crypto, forex, trading, mlm, pyramide'
  where nom = 'Business FCFA' and (mots_exclus is null or mots_exclus = '');
