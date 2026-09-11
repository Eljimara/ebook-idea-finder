-- A executer dans Supabase > SQL Editor, apres 001_create_univers.sql
-- Idempotent : n'insere que les univers absents (par nom)

insert into univers (nom, description)
select v.nom, v.description
from (values
  ('G40ans+', 'Affiliation Amazon et contenu TikTok pour femmes de 40 ans et plus'),
  ('MaraDigitalPlanner', 'Planification et organisation, Pinterest'),
  ('DigitalBoutikSn', 'Produits digitaux generaux, Etsy/Payhip'),
  ('TactikoFoot', 'Contenu football'),
  ('Waajal Salat', 'Priere, spiritualite musulmane'),
  ('Livres enfants KDP', 'Coloriage et activites enfants'),
  ('Business FCFA', 'Idees de business en ligne pour salaries africains francophones')
) as v(nom, description)
where not exists (
  select 1 from univers u where u.nom = v.nom
);
