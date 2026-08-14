/**
 * Text helpers for the AI engine: tokenization, normalization,
 * stopword removal, and naive stemming.
 */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'they', 'them',
  'their', 'this', 'some', 'any', 'all', 'what', 'which', 'who', 'whom', 'under',
  'above', 'into', 'over', 'does', 'did', 'do', 'have', 'had', 'about', 'than',
  'too', 'very', 'can', 'would', 'could', 'should', 'just', 'because', 'how',
  'where', 'when', 'why', 'need', 'want', 'need', 'rent', 'for', 'per', 'near',
]);

/** Normalize a string: lowercase, trim, collapse whitespace. */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Split text into tokens (word characters), filtered. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (t) => t.length > 1 && !STOPWORDS.has(t)
  );
}

/** Crude stemmer (light suffix stripping) for better matching. */
export function stem(word: string): string {
  if (word.length <= 3) return word;
  let w = word;
  if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('es') && w.length > 3) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) w = w.slice(0, -1);
  else if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  return w;
}

/** Tokenize + stem each token. */
export function analyze(text: string): string[] {
  return tokenize(text).map(stem);
}

/** Build a term-frequency map from tokens. */
export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

/** Compute cosine similarity between two token-frequency maps. */
export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [k, v] of a) {
    normA += v * v;
    const bv = b.get(k) || 0;
    dot += v * bv;
  }
  for (const v of b.values()) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Levenshtein edit distance for typo correction. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Extract a price range from a natural-language query.
 * e.g. "under 800", "under ₹800", "₹500 to ₹1000", "max 2000".
 */
export function extractPriceRange(query: string): { min?: number; max?: number } | null {
  const normalized = query.toLowerCase();
  const priceRegex = /(?:rs\.?|inr|rupees|\u20b9)?\s*([0-9][0-9,]*)/g;
  const matches: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = priceRegex.exec(normalized)) !== null) {
    const num = parseInt(m[1].replace(/,/g, ''), 10);
    if (!Number.isNaN(num)) matches.push(num);
  }
  if (matches.length === 0) return null;

  if (/under|below|less than|max|upto|up to|<=/.test(normalized)) {
    return { max: Math.max(...matches) };
  }
  if (/above|over|more than|min|>=|at least/.test(normalized)) {
    return { min: Math.min(...matches) };
  }
  if (matches.length >= 2) {
    return { min: Math.min(...matches), max: Math.max(...matches) };
  }
  return null;
}

/** Detect a category hint from natural language (best-effort keyword map). */
export function detectCategory(text: string): string | null {
  const t = normalize(text);
  const rules: Array<[RegExp, string]> = [
    [/headphone|earbud|earphone|noise cancelling/, 'audio'],
    [/camera|dslr|photograph|lens|gopro|mirrorless/, 'cameras'],
    [/drone|quadcopter|aerial camera/, 'drones'],
    [/laptop|macbook|notebook|ultrabook|gaming pc|desktop/, 'laptops'],
    [/tablet|ipad/, 'tablets'],
    [/smartphone|iphone|android|mobile phone|galaxy/, 'smartphones'],
    [/speaker|partybox|bluetooth speaker|jbl/, 'speakers'],
    [/watch|smartwatch|fitness band|wearable/, 'wearables'],
    [/projector|home theatre|presentation screen/, 'projectors'],
    [/gaming|playstation|ps5|xbox|game console|controller/, 'gaming'],
    [/bicycle|mountain bike|cycle|cycling/, 'sports'],
    [/tent|camping|hiking|trekking/, 'camping'],
    [/sports|skateboard|fitness|gym|cricket|football/, 'sports'],
    [/car|scooter|motorcycle|vehicle|auto/, 'vehicles'],
    [/drill|hammer|saw|power tool|equipment/, 'tools-equipment'],
    [/guitar|piano|keyboard|musical|drum/, 'musical-instruments'],
    [/furniture|sofa|table|chair|desk/, 'furniture'],
    [/appliance|refrigerator|fridge|washing machine|microwave/, 'appliances'],
    [/dress|outfit|costume|clothing|fashion/, 'fashion'],
    [/book|textbook|study guide/, 'books'],
    [/party|event decor|canopy/, 'party-events'],
    [/tv|television/, 'electronics'],
  ];
  for (const [re, slug] of rules) {
    if (re.test(t)) return slug;
  }
  return null;
}
