const express = require('express');
const { supabase } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('univers')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { nom, description, mots_cles, mots_exclus } = req.body;

  if (!nom || !nom.trim()) {
    return res.status(400).json({ error: 'Le nom est obligatoire.' });
  }

  const { data, error } = await supabase
    .from('univers')
    .insert({
      nom: nom.trim(),
      description: description ? description.trim() : null,
      mots_cles: mots_cles ? mots_cles.trim() : null,
      mots_exclus: mots_exclus ? mots_exclus.trim() : null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, description, mots_cles, mots_exclus } = req.body;

  if (!nom || !nom.trim()) {
    return res.status(400).json({ error: 'Le nom est obligatoire.' });
  }

  const { data, error } = await supabase
    .from('univers')
    .update({
      nom: nom.trim(),
      description: description ? description.trim() : null,
      mots_cles: mots_cles ? mots_cles.trim() : null,
      mots_exclus: mots_exclus ? mots_exclus.trim() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from('univers').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
