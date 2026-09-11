const googleTrends = require('google-trends-api');

const GEOS = [
  { code: 'FR', label: 'Google Trends (FR)' },
  { code: 'SN', label: 'Google Trends (SN)' },
];

async function getRelatedQueriesForGeo(keyword, geo, label) {
  try {
    const raw = await googleTrends.relatedQueries({ keyword, geo, hl: 'fr' });
    const parsed = JSON.parse(raw);
    const rankedLists = parsed?.default?.rankedList || [];

    const results = [];
    for (const list of rankedLists) {
      for (const item of list.rankedKeyword || []) {
        if (item?.query) {
          results.push({ texte: item.query, source: label });
        }
      }
    }
    return results;
  } catch (err) {
    console.warn(`[google-trends] Echec pour geo=${geo}, mot-cle="${keyword}" :`, err.message);
    return [];
  }
}

async function getGoogleTrendsResults(keyword) {
  const resultsByGeo = await Promise.all(
    GEOS.map((geo) => getRelatedQueriesForGeo(keyword, geo.code, geo.label))
  );
  return resultsByGeo.flat();
}

module.exports = { getGoogleTrendsResults };
