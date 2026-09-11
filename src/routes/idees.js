const express = require('express');
const { supabase } = require('../db');

const router = express.Router();

const STATUTS_VALIDES = ['a_explorer', 'en_cours', 'publie'];

router.get('/', async (req, res) => {
  const { univers_id, statut } = req.query;

  let query = supabase
    .from('idees')
    .select('*, univers(nom)')
    .order('created_at', { ascending: false });

  if (univers_id) query = query.eq('univers_id', univers_id);
  if (statut) query = query.eq('statut', statut);

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { univers_id, texte, source, mot_cle } = req.body;

  if (!texte || !texte.trim()) {
    return res.status(400).json({ error: 'Le texte est obligatoire.' });
  }

  const texteTrim = texte.trim();

  let dupCheck = supabase.from('idees').select('id').ilike('texte', texteTrim);
  dupCheck = univers_id ? dupCheck.eq('univers_id', univers_id) : dupCheck.is('univers_id', null);

  const { data: existing, error: checkError } = await dupCheck;

  if (checkError) return res.status(500).json({ error: checkError.message });

  if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'Cette idee est deja sauvegardee.' });
  }

  const { data, error } = await supabase
    .from('idees')
    .insert({
      univers_id: univers_id || null,
      texte: texteTrim,
      source: source || null,
      mot_cle: mot_cle || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  if (!STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({
      error: `Statut invalide. Valeurs possibles : ${STATUTS_VALIDES.join(', ')}`,
    });
  }

  const { data, error } = await supabase
    .from('idees')
    .update({ statut })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from('idees').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
