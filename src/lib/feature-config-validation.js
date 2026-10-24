const CONFIG_FIELDS = {
  saweran: { enabled: "boolean", minimum: "number", suggested: "string", anonymous: "boolean", messageLimit: "number" },
  anonim: { enabled: "boolean", display: "string", ranking: "boolean", minimum: "number" },
  pesan: { limit: "number", moderation: "boolean", blocked: "string", minimum: "number" },
  target: { name: "string", amount: "number", deadline: "string", style: "string", minimum: "number" },
  mediashare: { enabled: "boolean", duration: "number", domains: "string", review: "boolean", minimum: "number" },
  voicenote: { enabled: "boolean", duration: "number", size: "number", approval: "boolean", minimum: "number" },
  lagu: { provider: "string", limit: "number", blocked: "string", minimum: "number" },
  qris: { target: "string", caption: "string", showUsername: "boolean", minimum: "number" },
  leaderboard: { period: "string", limit: "number", hideAnonymous: "boolean", minimum: "number" },
  subathon: { initial: "number", perAmount: "number", cap: "number", minimum: "number" },
  "running-text": { speed: "string", duration: "number", limit: "number", moderation: "boolean", minimum: "number" },
  soundboard: { volume: "number", cooldown: "number", triggers: "string", minimum: "number" },
  polling: { question: "string", options: "string", duration: "number", oneVote: "boolean", minimum: "number" },
  "vip-queue": { policy: "string", limit: "number", review: "boolean", minimum: "number" },
  bagpao: { mode: "string", notes: "string", minimum: "number" },
  gachaton: { mode: "string", limit: "number", history: "boolean", minimum: "number" },
  bidcoin: { label: "string", dailyLimit: "number", rules: "string", minimum: "number" },
  store: { supplier: "string", limit: "number", refund: "number", minimum: "number" },
  notifikasi: { inApp: "boolean", email: "boolean", events: "string", minimum: "number" },
  kompetisi: { title: "string", period: "string", scoring: "string", minimum: "number" },
};

const FIELD_LIMITS = {
  minimum: [1000, 100000000],
  saweran: { messageLimit: [0, 500] },
  target: { amount: [1000, 1000000000] },
  mediashare: { duration: [5, 600] },
  voicenote: { duration: [3, 180], size: [1, 25] },
  lagu: { limit: [1, 100] },
  leaderboard: { limit: [3, 100] },
  subathon: { initial: [1, 1440], perAmount: [0, 3600], cap: [1, 10080] },
  "running-text": { duration: [3, 60], limit: [10, 240] },
  soundboard: { volume: [0, 100], cooldown: [1, 600] },
  polling: { duration: [1, 1440] },
  "vip-queue": { limit: [1, 500] },
  gachaton: { limit: [1, 100] },
  bidcoin: { dailyLimit: [0, 100000] },
  store: { limit: [1, 500], refund: [0, 90] },
};

const STRING_LIMITS = {
  suggested: 500,
  display: 80,
  blocked: 2000,
  name: 120,
  deadline: 10,
  style: 40,
  domains: 2000,
  provider: 100,
  target: 100,
  caption: 200,
  period: 40,
  speed: 20,
  triggers: 2000,
  question: 300,
  options: 2000,
  policy: 100,
  mode: 100,
  notes: 2000,
  label: 80,
  rules: 2000,
  supplier: 100,
  events: 1000,
  title: 160,
  scoring: 2000,
  period: 200,
};

function isValidDateOnly(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isValidDomainList(value) {
  if (!value.trim()) return true;
  const domains = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const valid = domains.every((domain) => /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain));
  return valid && new Set(domains.map((domain) => domain.toLowerCase())).size === domains.length;
}

function isValidSuggestedAmounts(value) {
  if (!value.trim()) return true;
  const amounts = value.split(",").map((item) => item.trim());
  return amounts.length <= 12 && amounts.every((item) => {
    const amount = Number(item);
    return Number.isSafeInteger(amount) && amount >= 1000 && amount <= 100000000 && amount % 1000 === 0;
  });
}

/** Validate persisted creator module settings against the fields actually supported by each module. */
export function validateFeatureConfiguration(featureKey, configuration) {
  const schema = CONFIG_FIELDS[featureKey];
  if (!schema || !configuration || typeof configuration !== "object" || Array.isArray(configuration)) return false;
  const entries = Object.entries(configuration);
  if (entries.length > 100 || JSON.stringify(configuration).length > 20000) return false;

  for (const [key, value] of entries) {
    const expectedType = schema[key];
    if (!expectedType) return false;
    if (expectedType === "boolean") {
      if (typeof value !== "boolean") return false;
      continue;
    }
    if (expectedType === "number") {
      if (typeof value !== "number" || !Number.isSafeInteger(value)) return false;
      const bounds = key === "minimum" ? FIELD_LIMITS.minimum : FIELD_LIMITS[featureKey]?.[key];
      if (bounds && (value < bounds[0] || value > bounds[1])) return false;
      continue;
    }
    if (typeof value !== "string" || value.length > (STRING_LIMITS[key] ?? 2000)) return false;
    if (key === "deadline" && !isValidDateOnly(value.trim())) return false;
    if (key === "domains" && !isValidDomainList(value)) return false;
    if (key === "suggested" && !isValidSuggestedAmounts(value)) return false;
  }
  return true;
}
