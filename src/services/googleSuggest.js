const SOURCE_LABEL = 'Suggestions Google';

async function getGoogleSuggestResults(keyword) {
  const url = `http://suggestqueries.google.com/complete/search?client=firefox&hl=fr&q=${encodeURIComponent(
    keyword
  )}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
    return suggestions.map((texte) => ({ texte, source: SOURCE_LABEL }));
  } catch (err) {
    console.warn(`[google-suggest] Echec pour mot-cle="${keyword}" :`, err.message);
    return [];
  }
}

module.exports = { getGoogleSuggestResults };
