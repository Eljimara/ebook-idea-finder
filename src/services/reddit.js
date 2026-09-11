const SOURCE_LABEL = 'Reddit';
const USER_AGENT = 'ebook-idea-finder/1.0';

async function getRedditResults(keyword) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
    keyword
  )}&sort=relevance&limit=25`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const posts = data?.data?.children || [];

    return posts
      .map((p) => p?.data?.title)
      .filter((titre) => typeof titre === 'string' && titre.trim())
      .map((texte) => ({ texte: texte.trim(), source: SOURCE_LABEL }));
  } catch (err) {
    console.warn(`[reddit] Echec pour mot-cle="${keyword}" :`, err.message);
    return [];
  }
}

module.exports = { getRedditResults };
