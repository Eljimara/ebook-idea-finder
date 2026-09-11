require('dotenv').config();
const { supabase } = require('../src/db');
const { DEFAULT_UNIVERS } = require('../src/seedData');

async function seed() {
  const { data: existing, error: fetchError } = await supabase.from('univers').select('id, nom');

  if (fetchError) {
    console.error('Erreur lors de la lecture de la table univers :', fetchError.message);
    process.exit(1);
  }

  const existingByName = new Map((existing || []).map((u) => [u.nom, u.id]));

  const toInsert = DEFAULT_UNIVERS.filter((u) => !existingByName.has(u.nom));
  const toUpdate = DEFAULT_UNIVERS.filter((u) => existingByName.has(u.nom));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('univers').insert(toInsert);
    if (insertError) {
      console.error("Erreur lors de l'insertion des univers :", insertError.message);
      process.exit(1);
    }
    console.log(`${toInsert.length} univers inseres.`);
  }

  for (const u of toUpdate) {
    const { error: updateError } = await supabase
      .from('univers')
      .update({ mots_cles: u.mots_cles, mots_exclus: u.mots_exclus, description: u.description })
      .eq('id', existingByName.get(u.nom));

    if (updateError) {
      console.error(`Erreur lors de la mise a jour de "${u.nom}" :`, updateError.message);
      process.exit(1);
    }
  }

  if (toUpdate.length > 0) {
    console.log(`${toUpdate.length} univers mis a jour (mots-cles).`);
  }

  if (toInsert.length === 0 && toUpdate.length === 0) {
    console.log('Rien a faire.');
  }
}

seed();
