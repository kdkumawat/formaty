export { searchCountries, countryByCode, countryByIana, COUNTRY_CATALOG } from "./countries";
export type { CountryEntry } from "./countries";

export interface CatalogCity {
  city: string;
  country: string;
  countryCode: string;
  iana: string;
}

const ISO: Record<string, string> = {
  India: "IN",
  "United Kingdom": "GB",
  "United States": "US",
  Canada: "CA",
  Mexico: "MX",
  Brazil: "BR",
  Argentina: "AR",
  Chile: "CL",
  Peru: "PE",
  Colombia: "CO",
  Venezuela: "VE",
  Cuba: "CU",
  "Costa Rica": "CR",
  Panama: "PA",
  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  Qatar: "QA",
  Kuwait: "KW",
  Bahrain: "BH",
  Oman: "OM",
  Iran: "IR",
  Iraq: "IQ",
  Lebanon: "LB",
  Jordan: "JO",
  Syria: "SY",
  Israel: "IL",
  Singapore: "SG",
  Japan: "JP",
  "South Korea": "KR",
  "Hong Kong": "HK",
  Macau: "MO",
  China: "CN",
  Australia: "AU",
  "New Zealand": "NZ",
  Fiji: "FJ",
  "Papua New Guinea": "PG",
  Guam: "GU",
  France: "FR",
  Germany: "DE",
  Netherlands: "NL",
  Belgium: "BE",
  Luxembourg: "LU",
  Spain: "ES",
  Portugal: "PT",
  Italy: "IT",
  Austria: "AT",
  Switzerland: "CH",
  Sweden: "SE",
  Norway: "NO",
  Denmark: "DK",
  Finland: "FI",
  Iceland: "IS",
  Ireland: "IE",
  Poland: "PL",
  Czechia: "CZ",
  Hungary: "HU",
  Romania: "RO",
  Bulgaria: "BG",
  Greece: "GR",
  Serbia: "RS",
  Croatia: "HR",
  Turkey: "TR",
  Ukraine: "UA",
  Russia: "RU",
  Egypt: "EG",
  Morocco: "MA",
  Algeria: "DZ",
  Tunisia: "TN",
  "South Africa": "ZA",
  Nigeria: "NG",
  Ghana: "GH",
  Senegal: "SN",
  Ethiopia: "ET",
  Kenya: "KE",
  Tanzania: "TZ",
  Uganda: "UG",
  Zimbabwe: "ZW",
  Pakistan: "PK",
  Bangladesh: "BD",
  "Sri Lanka": "LK",
  Nepal: "NP",
  Bhutan: "BT",
  Myanmar: "MM",
  Thailand: "TH",
  Vietnam: "VN",
  Cambodia: "KH",
  Laos: "LA",
  Malaysia: "MY",
  Indonesia: "ID",
  Philippines: "PH",
  Taiwan: "TW",
  Mongolia: "MN",
  Worldwide: "UN",
};

function withIso<T extends { country: string }>(row: T): T & { countryCode: string } {
  return { ...row, countryCode: ISO[row.country] ?? "" };
}

/** Major cities first. Search also matches IANA ids and ISO country codes. */
export const CITY_CATALOG: CatalogCity[] = [
  { city: "UTC", country: "Worldwide", iana: "UTC" },

  // India
  { city: "Kolkata", country: "India", iana: "Asia/Kolkata" },
  { city: "Mumbai", country: "India", iana: "Asia/Kolkata" },
  { city: "Delhi", country: "India", iana: "Asia/Kolkata" },
  { city: "New Delhi", country: "India", iana: "Asia/Kolkata" },
  { city: "Bengaluru", country: "India", iana: "Asia/Kolkata" },
  { city: "Bangalore", country: "India", iana: "Asia/Kolkata" },
  { city: "Chennai", country: "India", iana: "Asia/Kolkata" },
  { city: "Hyderabad", country: "India", iana: "Asia/Kolkata" },
  { city: "Pune", country: "India", iana: "Asia/Kolkata" },
  { city: "Ahmedabad", country: "India", iana: "Asia/Kolkata" },
  { city: "Jaipur", country: "India", iana: "Asia/Kolkata" },
  { city: "Lucknow", country: "India", iana: "Asia/Kolkata" },
  { city: "Surat", country: "India", iana: "Asia/Kolkata" },
  { city: "Kochi", country: "India", iana: "Asia/Kolkata" },
  { city: "Goa", country: "India", iana: "Asia/Kolkata" },

  // UK & Ireland
  { city: "London", country: "United Kingdom", iana: "Europe/London" },
  { city: "Edinburgh", country: "United Kingdom", iana: "Europe/London" },
  { city: "Manchester", country: "United Kingdom", iana: "Europe/London" },
  { city: "Birmingham", country: "United Kingdom", iana: "Europe/London" },
  { city: "Glasgow", country: "United Kingdom", iana: "Europe/London" },
  { city: "Liverpool", country: "United Kingdom", iana: "Europe/London" },
  { city: "Bristol", country: "United Kingdom", iana: "Europe/London" },
  { city: "Dublin", country: "Ireland", iana: "Europe/Dublin" },
  { city: "Cork", country: "Ireland", iana: "Europe/Dublin" },

  // USA - Eastern
  { city: "New York", country: "United States", iana: "America/New_York" },
  { city: "Boston", country: "United States", iana: "America/New_York" },
  { city: "Washington", country: "United States", iana: "America/New_York" },
  { city: "Philadelphia", country: "United States", iana: "America/New_York" },
  { city: "Atlanta", country: "United States", iana: "America/New_York" },
  { city: "Miami", country: "United States", iana: "America/New_York" },
  { city: "Detroit", country: "United States", iana: "America/New_York" },

  // USA - Pacific
  { city: "Los Angeles", country: "United States", iana: "America/Los_Angeles" },
  { city: "San Francisco", country: "United States", iana: "America/Los_Angeles" },
  { city: "San Diego", country: "United States", iana: "America/Los_Angeles" },
  { city: "Seattle", country: "United States", iana: "America/Los_Angeles" },
  { city: "Portland", country: "United States", iana: "America/Los_Angeles" },
  { city: "Las Vegas", country: "United States", iana: "America/Los_Angeles" },

  // USA - Central / Mountain
  { city: "Chicago", country: "United States", iana: "America/Chicago" },
  { city: "Houston", country: "United States", iana: "America/Chicago" },
  { city: "Dallas", country: "United States", iana: "America/Chicago" },
  { city: "Austin", country: "United States", iana: "America/Chicago" },
  { city: "Minneapolis", country: "United States", iana: "America/Chicago" },
  { city: "Denver", country: "United States", iana: "America/Denver" },
  { city: "Salt Lake City", country: "United States", iana: "America/Denver" },
  { city: "Phoenix", country: "United States", iana: "America/Phoenix" },
  { city: "Honolulu", country: "United States", iana: "Pacific/Honolulu" },
  { city: "Anchorage", country: "United States", iana: "America/Anchorage" },

  // Canada
  { city: "Toronto", country: "Canada", iana: "America/Toronto" },
  { city: "Ottawa", country: "Canada", iana: "America/Toronto" },
  { city: "Montreal", country: "Canada", iana: "America/Toronto" },
  { city: "Vancouver", country: "Canada", iana: "America/Vancouver" },
  { city: "Calgary", country: "Canada", iana: "America/Edmonton" },
  { city: "Edmonton", country: "Canada", iana: "America/Edmonton" },
  { city: "Halifax", country: "Canada", iana: "America/Halifax" },
  { city: "Winnipeg", country: "Canada", iana: "America/Winnipeg" },

  // Latin America
  { city: "Mexico City", country: "Mexico", iana: "America/Mexico_City" },
  { city: "Monterrey", country: "Mexico", iana: "America/Monterrey" },
  { city: "Guadalajara", country: "Mexico", iana: "America/Mexico_City" },
  { city: "Cancún", country: "Mexico", iana: "America/Cancun" },
  { city: "São Paulo", country: "Brazil", iana: "America/Sao_Paulo" },
  { city: "Rio de Janeiro", country: "Brazil", iana: "America/Sao_Paulo" },
  { city: "Brasília", country: "Brazil", iana: "America/Sao_Paulo" },
  { city: "Buenos Aires", country: "Argentina", iana: "America/Argentina/Buenos_Aires" },
  { city: "Santiago", country: "Chile", iana: "America/Santiago" },
  { city: "Lima", country: "Peru", iana: "America/Lima" },
  { city: "Bogotá", country: "Colombia", iana: "America/Bogota" },
  { city: "Caracas", country: "Venezuela", iana: "America/Caracas" },
  { city: "Havana", country: "Cuba", iana: "America/Havana" },
  { city: "San José", country: "Costa Rica", iana: "America/Costa_Rica" },
  { city: "Panama City", country: "Panama", iana: "America/Panama" },

  // Europe
  { city: "Paris", country: "France", iana: "Europe/Paris" },
  { city: "Lyon", country: "France", iana: "Europe/Paris" },
  { city: "Marseille", country: "France", iana: "Europe/Paris" },
  { city: "Berlin", country: "Germany", iana: "Europe/Berlin" },
  { city: "Munich", country: "Germany", iana: "Europe/Berlin" },
  { city: "Hamburg", country: "Germany", iana: "Europe/Berlin" },
  { city: "Frankfurt", country: "Germany", iana: "Europe/Berlin" },
  { city: "Amsterdam", country: "Netherlands", iana: "Europe/Amsterdam" },
  { city: "Rotterdam", country: "Netherlands", iana: "Europe/Amsterdam" },
  { city: "Brussels", country: "Belgium", iana: "Europe/Brussels" },
  { city: "Luxembourg", country: "Luxembourg", iana: "Europe/Luxembourg" },
  { city: "Madrid", country: "Spain", iana: "Europe/Madrid" },
  { city: "Barcelona", country: "Spain", iana: "Europe/Madrid" },
  { city: "Lisbon", country: "Portugal", iana: "Europe/Lisbon" },
  { city: "Rome", country: "Italy", iana: "Europe/Rome" },
  { city: "Milan", country: "Italy", iana: "Europe/Rome" },
  { city: "Venice", country: "Italy", iana: "Europe/Rome" },
  { city: "Vienna", country: "Austria", iana: "Europe/Vienna" },
  { city: "Zurich", country: "Switzerland", iana: "Europe/Zurich" },
  { city: "Geneva", country: "Switzerland", iana: "Europe/Zurich" },
  { city: "Stockholm", country: "Sweden", iana: "Europe/Stockholm" },
  { city: "Oslo", country: "Norway", iana: "Europe/Oslo" },
  { city: "Copenhagen", country: "Denmark", iana: "Europe/Copenhagen" },
  { city: "Helsinki", country: "Finland", iana: "Europe/Helsinki" },
  { city: "Reykjavik", country: "Iceland", iana: "Atlantic/Reykjavik" },
  { city: "Warsaw", country: "Poland", iana: "Europe/Warsaw" },
  { city: "Kraków", country: "Poland", iana: "Europe/Warsaw" },
  { city: "Prague", country: "Czechia", iana: "Europe/Prague" },
  { city: "Budapest", country: "Hungary", iana: "Europe/Budapest" },
  { city: "Bucharest", country: "Romania", iana: "Europe/Bucharest" },
  { city: "Sofia", country: "Bulgaria", iana: "Europe/Sofia" },
  { city: "Athens", country: "Greece", iana: "Europe/Athens" },
  { city: "Belgrade", country: "Serbia", iana: "Europe/Belgrade" },
  { city: "Zagreb", country: "Croatia", iana: "Europe/Zagreb" },
  { city: "Istanbul", country: "Turkey", iana: "Europe/Istanbul" },
  { city: "Ankara", country: "Turkey", iana: "Europe/Istanbul" },
  { city: "Kyiv", country: "Ukraine", iana: "Europe/Kyiv" },
  { city: "Moscow", country: "Russia", iana: "Europe/Moscow" },
  { city: "Saint Petersburg", country: "Russia", iana: "Europe/Moscow" },

  // Middle East
  { city: "Dubai", country: "United Arab Emirates", iana: "Asia/Dubai" },
  { city: "Abu Dhabi", country: "United Arab Emirates", iana: "Asia/Dubai" },
  { city: "Riyadh", country: "Saudi Arabia", iana: "Asia/Riyadh" },
  { city: "Jeddah", country: "Saudi Arabia", iana: "Asia/Riyadh" },
  { city: "Doha", country: "Qatar", iana: "Asia/Qatar" },
  { city: "Kuwait City", country: "Kuwait", iana: "Asia/Kuwait" },
  { city: "Manama", country: "Bahrain", iana: "Asia/Bahrain" },
  { city: "Muscat", country: "Oman", iana: "Asia/Muscat" },
  { city: "Tehran", country: "Iran", iana: "Asia/Tehran" },
  { city: "Baghdad", country: "Iraq", iana: "Asia/Baghdad" },
  { city: "Beirut", country: "Lebanon", iana: "Asia/Beirut" },
  { city: "Amman", country: "Jordan", iana: "Asia/Amman" },
  { city: "Damascus", country: "Syria", iana: "Asia/Damascus" },
  { city: "Tel Aviv", country: "Israel", iana: "Asia/Jerusalem" },
  { city: "Jerusalem", country: "Israel", iana: "Asia/Jerusalem" },

  // Africa
  { city: "Cairo", country: "Egypt", iana: "Africa/Cairo" },
  { city: "Alexandria", country: "Egypt", iana: "Africa/Cairo" },
  { city: "Casablanca", country: "Morocco", iana: "Africa/Casablanca" },
  { city: "Algiers", country: "Algeria", iana: "Africa/Algiers" },
  { city: "Tunis", country: "Tunisia", iana: "Africa/Tunis" },
  { city: "Lagos", country: "Nigeria", iana: "Africa/Lagos" },
  { city: "Abuja", country: "Nigeria", iana: "Africa/Lagos" },
  { city: "Accra", country: "Ghana", iana: "Africa/Accra" },
  { city: "Dakar", country: "Senegal", iana: "Africa/Dakar" },
  { city: "Addis Ababa", country: "Ethiopia", iana: "Africa/Addis_Ababa" },
  { city: "Nairobi", country: "Kenya", iana: "Africa/Nairobi" },
  { city: "Dar es Salaam", country: "Tanzania", iana: "Africa/Dar_es_Salaam" },
  { city: "Kampala", country: "Uganda", iana: "Africa/Kampala" },
  { city: "Johannesburg", country: "South Africa", iana: "Africa/Johannesburg" },
  { city: "Cape Town", country: "South Africa", iana: "Africa/Johannesburg" },
  { city: "Durban", country: "South Africa", iana: "Africa/Johannesburg" },
  { city: "Harare", country: "Zimbabwe", iana: "Africa/Harare" },

  // Asia & Pacific
  { city: "Karachi", country: "Pakistan", iana: "Asia/Karachi" },
  { city: "Lahore", country: "Pakistan", iana: "Asia/Karachi" },
  { city: "Islamabad", country: "Pakistan", iana: "Asia/Karachi" },
  { city: "Dhaka", country: "Bangladesh", iana: "Asia/Dhaka" },
  { city: "Colombo", country: "Sri Lanka", iana: "Asia/Colombo" },
  { city: "Kathmandu", country: "Nepal", iana: "Asia/Kathmandu" },
  { city: "Thimphu", country: "Bhutan", iana: "Asia/Thimphu" },
  { city: "Yangon", country: "Myanmar", iana: "Asia/Yangon" },
  { city: "Bangkok", country: "Thailand", iana: "Asia/Bangkok" },
  { city: "Chiang Mai", country: "Thailand", iana: "Asia/Bangkok" },
  { city: "Hanoi", country: "Vietnam", iana: "Asia/Bangkok" },
  { city: "Ho Chi Minh City", country: "Vietnam", iana: "Asia/Ho_Chi_Minh" },
  { city: "Phnom Penh", country: "Cambodia", iana: "Asia/Phnom_Penh" },
  { city: "Vientiane", country: "Laos", iana: "Asia/Vientiane" },
  { city: "Kuala Lumpur", country: "Malaysia", iana: "Asia/Kuala_Lumpur" },
  { city: "Singapore", country: "Singapore", iana: "Asia/Singapore" },
  { city: "Jakarta", country: "Indonesia", iana: "Asia/Jakarta" },
  { city: "Bali", country: "Indonesia", iana: "Asia/Makassar" },
  { city: "Manila", country: "Philippines", iana: "Asia/Manila" },
  { city: "Taipei", country: "Taiwan", iana: "Asia/Taipei" },
  { city: "Hong Kong", country: "Hong Kong", iana: "Asia/Hong_Kong" },
  { city: "Macau", country: "Macau", iana: "Asia/Macau" },
  { city: "Shanghai", country: "China", iana: "Asia/Shanghai" },
  { city: "Beijing", country: "China", iana: "Asia/Shanghai" },
  { city: "Shenzhen", country: "China", iana: "Asia/Shanghai" },
  { city: "Guangzhou", country: "China", iana: "Asia/Shanghai" },
  { city: "Chengdu", country: "China", iana: "Asia/Shanghai" },
  { city: "Tokyo", country: "Japan", iana: "Asia/Tokyo" },
  { city: "Osaka", country: "Japan", iana: "Asia/Tokyo" },
  { city: "Kyoto", country: "Japan", iana: "Asia/Tokyo" },
  { city: "Yokohama", country: "Japan", iana: "Asia/Tokyo" },
  { city: "Sapporo", country: "Japan", iana: "Asia/Tokyo" },
  { city: "Seoul", country: "South Korea", iana: "Asia/Seoul" },
  { city: "Busan", country: "South Korea", iana: "Asia/Seoul" },
  { city: "Ulaanbaatar", country: "Mongolia", iana: "Asia/Ulaanbaatar" },
  { city: "Sydney", country: "Australia", iana: "Australia/Sydney" },
  { city: "Melbourne", country: "Australia", iana: "Australia/Melbourne" },
  { city: "Brisbane", country: "Australia", iana: "Australia/Brisbane" },
  { city: "Perth", country: "Australia", iana: "Australia/Perth" },
  { city: "Adelaide", country: "Australia", iana: "Australia/Adelaide" },
  { city: "Hobart", country: "Australia", iana: "Australia/Hobart" },
  { city: "Canberra", country: "Australia", iana: "Australia/Sydney" },
  { city: "Auckland", country: "New Zealand", iana: "Pacific/Auckland" },
  { city: "Wellington", country: "New Zealand", iana: "Pacific/Auckland" },
  { city: "Christchurch", country: "New Zealand", iana: "Pacific/Auckland" },
  { city: "Suva", country: "Fiji", iana: "Pacific/Fiji" },
  { city: "Port Moresby", country: "Papua New Guinea", iana: "Pacific/Port_Moresby" },
  { city: "Guam", country: "Guam", iana: "Pacific/Guam" },
].map(withIso);

const ABBR_TO_IANA: Record<string, string> = {
  IST: "Asia/Kolkata",
  JST: "Asia/Tokyo",
  KST: "Asia/Seoul",
  SGT: "Asia/Singapore",
  HKT: "Asia/Hong_Kong",
  GST: "Asia/Dubai",
  BST: "Europe/London",
  GMT: "UTC",
  UTC: "UTC",
  EST: "America/New_York",
  EDT: "America/New_York",
  CST: "America/Chicago",
  CDT: "America/Chicago",
  MST: "America/Denver",
  MDT: "America/Denver",
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
  AEST: "Australia/Sydney",
  AEDT: "Australia/Sydney",
};

export const SUGGESTED_CITIES: CatalogCity[] = [
  CITY_CATALOG.find((c) => c.city === "London")!,
  CITY_CATALOG.find((c) => c.city === "New York")!,
  CITY_CATALOG.find((c) => c.city === "Dubai")!,
  CITY_CATALOG.find((c) => c.city === "Singapore")!,
  CITY_CATALOG.find((c) => c.city === "Tokyo")!,
];

export function searchLocations(query: string, limit = 12): CatalogCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITY_CATALOG.slice(0, limit);
  const scored = CITY_CATALOG.map((c) => {
    const city = c.city.toLowerCase();
    const country = c.country.toLowerCase();
    const iana = c.iana.toLowerCase();
    const code = c.countryCode.toLowerCase();
    let score = 0;
    if (city === q || iana === q || code === q) score = 100;
    else if (city.startsWith(q) || code.startsWith(q)) score = 80;
    else if (iana.includes(q)) score = 60;
    else if (city.includes(q)) score = 50;
    else if (country.includes(q) || code.includes(q)) score = 40;
    else if (q.replace(/\s+/g, "_") === iana.split("/")[1]) score = 70;
    return { c, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: CatalogCity[] = [];
  for (const { c } of scored) {
    const key = `${c.iana}:${c.city}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

export interface IanaSearchResult {
  iana: string;
  /** Best-effort display name derived from the IANA id (region/city). */
  label: string;
}

/**
 * Full IANA search across every timezone the runtime knows about
 * (via `Intl.supportedValuesOf("timeZone")` when available, falling back
 * to the catalog). This is what powers the global add-location picker so
 * the user can add any city in the world, not just curated ones.
 */
export function searchIanaZones(query: string, limit = 40): IanaSearchResult[] {
  const q = query.trim().toLowerCase();
  const all = listIanaZones();
  if (!q) {
    return all.slice(0, limit).map((iana) => ({ iana, label: iana }));
  }
  // Word-boundary prefix on the last segment ("Asia/Kolkata" -> "kolkata").
  // Plain substring matching is too loose: typing "India" surfaced
  // "Indian/Antananarivo" and "America/Indianapolis" before any of the
  // South-Asia zones the user actually meant.
  const lastSeg = (iana: string) => iana.split("/").pop()!.replace(/_/g, " ").toLowerCase();
  const regionSeg = (iana: string) => (iana.split("/")[0] ?? "").toLowerCase();
  const wordStarts = (hay: string, needle: string) => {
    if (hay === needle) return true;
    if (hay.startsWith(needle) && (needle.length === hay.length || /[\s_-]/.test(hay[needle.length]))) return true;
    return false;
  };
  const scored: Array<{ iana: string; label: string; score: number }> = [];
  for (const iana of all) {
    const lower = iana.toLowerCase();
    const last = lastSeg(iana);
    const region = regionSeg(iana);
    let score = 0;
    if (lower === q) score = 220;
    else if (last === q) score = 200;
    else if (wordStarts(last, q)) score = 160;
    else if (wordStarts(lower, q)) score = 130;
    else if (region === q) score = 110;
    else if (last.includes(` ${q}`) || lower.includes(`/${q}`)) score = 80;
    if (score > 0) {
      const label = iana.replace(/_/g, " ");
      scored.push({ iana, label, score });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.iana.localeCompare(b.iana));
  return scored.slice(0, limit).map(({ iana, label }) => ({ iana, label }));
}

export function cityByIana(iana: string): CatalogCity | undefined {
  return CITY_CATALOG.find((c) => c.iana === iana);
}

export function resolveZoneToken(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  if (t.toUpperCase() === "UTC" || t.toUpperCase() === "GMT") return "UTC";
  if (ABBR_TO_IANA[t.toUpperCase()]) return ABBR_TO_IANA[t.toUpperCase()];
  const byIana = CITY_CATALOG.find((c) => c.iana.toLowerCase() === t.toLowerCase());
  if (byIana) return byIana.iana;
  const byCity = searchLocations(t, 1)[0];
  if (byCity && t.length >= 3) {
    const cityMatch = byCity.city.toLowerCase() === t.toLowerCase() || byCity.iana.toLowerCase() === t.toLowerCase();
    const starts = byCity.city.toLowerCase().startsWith(t.toLowerCase());
    if (cityMatch || starts) return byCity.iana;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: t }).format(0);
    return t;
  } catch {
    return null;
  }
}

export function detectLocalIana(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function listIanaZones(): string[] {
  try {
    const supported = Intl.supportedValuesOf?.("timeZone");
    if (supported?.length) return [...supported];
  } catch {
    /* ignore */
  }
  return [...new Set(CITY_CATALOG.map((c) => c.iana))];
}

export function isValidIana(iana: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: iana }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function detectTimeFormat(): "12h" | "24h" {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).formatToParts(new Date());
    return parts.some((p) => p.type === "dayPeriod") ? "12h" : "24h";
  } catch {
    return "12h";
  }
}
