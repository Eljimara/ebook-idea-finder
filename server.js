require('dotenv').config();
const path = require('path');
const express = require('express');

const { supabase } = require('./src/db');
const { DEFAULT_UNIVERS } = require('./src/seedData');
const universRouter = require('./src/routes/univers');
const searchRouter = require('./src/routes/search');
const ideesRouter = require('./src/routes/idees');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/univers', universRouter);
app.use('/api/search', searchRouter);
app.use('/api/idees', ideesRouter);

async function seedIfEmpty() {
  const { count, error } = await supabase
    .from('univers')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.warn('[seed] Impossible de verifier la table univers :', error.message);
    return;
  }

  if (count === 0) {
    const { error: insertError } = await supabase.from('univers').insert(DEFAULT_UNIVERS);
    if (insertError) {
      console.warn('[seed] Echec du pre-remplissage automatique :', insertError.message);
    } else {
      console.log(`[seed] ${DEFAULT_UNIVERS.length} univers de depart inseres.`);
    }
  }
}

app.listen(PORT, async () => {
  console.log(`Serveur pret sur http://localhost:${PORT}`);
  await seedIfEmpty();
});
