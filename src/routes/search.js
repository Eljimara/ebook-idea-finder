const express = require('express');
const { supabase } = require('../db');
const { getGoogleTrendsResults } = require('../services/googleTrends');
const { getGoogleSuggestResults } = require('../services/googleSuggest');
const { getRedditResults } = require('../services/reddit');
const { getYoutubeResults } = require('../services/youtube');

const router = express.Router();

function parseList(str) {
  return (str || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
}

async function searchForKeyword(motCle) {
  const [trends, suggestions, reddit, youtube] = await Promise.all([
    getGoogleTrendsResults(motCle),
    getGoogleSuggestResults(motCle),
    getRedditResults(motCle),
    getYoutubeResults(motCle),
  ]);

  return [...trends, ...suggestions, ...reddit, ...youtube].map((r) => ({ ...r, motCle }));
}

function dedupeByText(resultats) {
  const parKey = new Map();
  const ordered = [];

  for (const r of resultats) {
    const key = r.texte.toLowerCase().trim().replace(/\s+/g, ' ');
    const existant = parKey.get(key);

    if (existant) {
      existant.occurrences += 1;
      continue;
    }

    const entree = { ...r, occurrences: 1 };
    parKey.set(key, entree);
    ordered.push(entree);
  }

  return ordered;
}

function filterExcluded(resultats, motsExclus) {
  if (motsExclus.length === 0) return resultats;

  const motsExclusLower = motsExclus.map((m) => m.toLowerCase());

  return resultats.filter((r) => {
    const texteLower = r.texte.toLowerCase();
    return !motsExclusLower.some((mot) => texteLower.includes(mot));
  });
}

function sortByRelevance(resultats, motsCles) {
  const motsClesLower = motsCles.map((m) => m.toLowerCase());
  const estPertinent = (texte) => {
    const texteLower = texte.toLowerCase();
    return motsClesLower.some((mc) => texteLower.includes(mc));
  };

  return [...resultats].sort((a, b) => {
    const diffPertinence = Number(!estPertinent(a.texte)) - Number(!estPertinent(b.texte));
    if (diffPertinence !== 0) return diffPertinence;
    return b.occurrences - a.occurrences;
  });
}

router.get('/', async (req, res) => {
  const { univers_id, keyword } = req.query;

  let motsCles = [];
  let motsExclus = [];

  if (univers_id) {
    const { data, error } = await supabase
      .from('univers')
      .select('nom, mots_cles, mots_exclus')
      .eq('id', univers_id)
      .single();

    if (error) return res.status(404).json({ error: 'Univers introuvable.' });

    motsCles = parseList(data.mots_cles);
    motsExclus = parseList(data.mots_exclus);

    if (motsCles.length === 0) {
      console.warn(
        `[search] Aucun mot-cle configure pour l'univers "${data.nom}", repli sur le nom.`
      );
      motsCles = [data.nom];
    }
  } else if (keyword && keyword.trim()) {
    motsCles = [keyword.trim()];
  } else {
    return res.status(400).json({ error: 'Fournir un univers_id ou un keyword.' });
  }

  const resultsPerKeyword = await Promise.all(motsCles.map(searchForKeyword));

  let resultats = dedupeByText(resultsPerKeyword.flat());
  resultats = filterExcluded(resultats, motsExclus);
  resultats = sortByRelevance(resultats, motsCles);

  res.json({
    motsCles,
    resultats,
  });
});

module.exports = router;
