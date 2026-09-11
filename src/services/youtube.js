const SOURCE_LABEL = 'YouTube';

const HTML_ENTITIES = {
  '&amp;': '&',
  '&#39;': "'",
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
};

function decodeHtmlEntities(str) {
  return str.replace(/&amp;|&#39;|&quot;|&lt;|&gt;/g, (m) => HTML_ENTITIES[m]);
}

async function getYoutubeResults(keyword) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('[youtube] YOUTUBE_API_KEY manquante dans .env, source ignoree.');
    return [];
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    keyword
  )}&type=video&relevanceLanguage=fr&maxResults=15&key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status} - ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    return items
      .map((item) => item?.snippet?.title)
      .filter((titre) => typeof titre === 'string' && titre.trim())
      .map((texte) => ({ texte: decodeHtmlEntities(texte.trim()), source: SOURCE_LABEL }));
  } catch (err) {
    console.warn(`[youtube] Echec pour mot-cle="${keyword}" :`, err.message);
    return [];
  }
}

module.exports = { getYoutubeResults };
