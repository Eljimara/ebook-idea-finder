-- A executer dans Supabase > SQL Editor
-- Ajoute la colonne mots_cles (recherche) sans toucher aux donnees existantes.

alter table univers add column if not exists mots_cles text;

-- Renseigne les mots-cles de recherche pour les 7 univers de depart
-- (idempotent : ne fait rien si la ligne n'existe pas encore ou si mots_cles est deja rempli).

update univers set mots_cles = 'femme 40 ans, beaute apres 40 ans, sante femme mature'
  where nom = 'G40ans+' and (mots_cles is null or mots_cles = '');

update univers set mots_cles = 'planificateur numerique, organisation quotidienne, bullet journal'
  where nom = 'MaraDigitalPlanner' and (mots_cles is null or mots_cles = '');

update univers set mots_cles = 'produit digital a vendre, creer ebook business'
  where nom = 'DigitalBoutikSn' and (mots_cles is null or mots_cles = '');

update univers set mots_cles = 'analyse tactique football, tactique foot'
  where nom = 'TactikoFoot' and (mots_cles is null or mots_cles = '');

update univers set mots_cles = 'concentration priere, presence dans la priere, khouchou'
  where nom = 'Waajal Salat' and (mots_cles is null or mots_cles = '');

update univers set mots_cles = 'livre de coloriage enfant, activite enfant a imprimer'
  where nom = 'Livres enfants KDP' and (mots_cles is null or mots_cles = '');

update univers set mots_cles = 'business en ligne Afrique, gagner de l''argent sur internet'
  where nom = 'Business FCFA' and (mots_cles is null or mots_cles = '');
