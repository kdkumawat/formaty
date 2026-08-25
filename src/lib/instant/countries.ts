/**
 * Curated ISO 3166-1 country list with capital city + primary IANA timezone.
 *
 * One entry per country. The IANA zone is the capital's IANA id (the
 * governmental / most-populous zone). For countries spanning multiple
 * zones (Russia, USA, France, etc.) users should still drill in via the
 * city search to reach a specific IANA.
 *
 * Search matches name, ISO code, and capital.
 */

export interface CountryEntry {
  name: string;
  /** ISO 3166-1 alpha-2. */
  code: string;
  capital: string;
  iana: string;
}

export const COUNTRY_CATALOG: CountryEntry[] = [
  // ── Africa ──
  { name: "Algeria", code: "DZ", capital: "Algiers", iana: "Africa/Algiers" },
  { name: "Angola", code: "AO", capital: "Luanda", iana: "Africa/Luanda" },
  { name: "Benin", code: "BJ", capital: "Porto-Novo", iana: "Africa/Porto-Novo" },
  { name: "Botswana", code: "BW", capital: "Gaborone", iana: "Africa/Gaborone" },
  { name: "Burkina Faso", code: "BF", capital: "Ouagadougou", iana: "Africa/Ouagadougou" },
  { name: "Burundi", code: "BI", capital: "Gitega", iana: "Africa/Bujumbura" },
  { name: "Cabo Verde", code: "CV", capital: "Praia", iana: "Atlantic/Cape_Verde" },
  { name: "Cameroon", code: "CM", capital: "Yaoundé", iana: "Africa/Douala" },
  { name: "Central African Republic", code: "CF", capital: "Bangui", iana: "Africa/Bangui" },
  { name: "Chad", code: "TD", capital: "N'Djamena", iana: "Africa/Ndjamena" },
  { name: "Comoros", code: "KM", capital: "Moroni", iana: "Indian/Comoro" },
  { name: "Congo (Brazzaville)", code: "CG", capital: "Brazzaville", iana: "Africa/Brazzaville" },
  { name: "Congo (Kinshasa)", code: "CD", capital: "Kinshasa", iana: "Africa/Kinshasa" },
  { name: "Côte d'Ivoire", code: "CI", capital: "Yamoussoukro", iana: "Africa/Abidjan" },
  { name: "Djibouti", code: "DJ", capital: "Djibouti", iana: "Africa/Djibouti" },
  { name: "Egypt", code: "EG", capital: "Cairo", iana: "Africa/Cairo" },
  { name: "Equatorial Guinea", code: "GQ", capital: "Malabo", iana: "Africa/Malabo" },
  { name: "Eritrea", code: "ER", capital: "Asmara", iana: "Africa/Asmara" },
  { name: "Eswatini", code: "SZ", capital: "Mbabane", iana: "Africa/Mbabane" },
  { name: "Ethiopia", code: "ET", capital: "Addis Ababa", iana: "Africa/Addis_Ababa" },
  { name: "Gabon", code: "GA", capital: "Libreville", iana: "Africa/Libreville" },
  { name: "Gambia", code: "GM", capital: "Banjul", iana: "Africa/Banjul" },
  { name: "Ghana", code: "GH", capital: "Accra", iana: "Africa/Accra" },
  { name: "Guinea", code: "GN", capital: "Conakry", iana: "Africa/Conakry" },
  { name: "Guinea-Bissau", code: "GW", capital: "Bissau", iana: "Africa/Bissau" },
  { name: "Kenya", code: "KE", capital: "Nairobi", iana: "Africa/Nairobi" },
  { name: "Lesotho", code: "LS", capital: "Maseru", iana: "Africa/Maseru" },
  { name: "Liberia", code: "LR", capital: "Monrovia", iana: "Africa/Monrovia" },
  { name: "Libya", code: "LY", capital: "Tripoli", iana: "Africa/Tripoli" },
  { name: "Madagascar", code: "MG", capital: "Antananarivo", iana: "Indian/Antananarivo" },
  { name: "Malawi", code: "MW", capital: "Lilongwe", iana: "Africa/Blantyre" },
  { name: "Mali", code: "ML", capital: "Bamako", iana: "Africa/Bamako" },
  { name: "Mauritania", code: "MR", capital: "Nouakchott", iana: "Africa/Nouakchott" },
  { name: "Mauritius", code: "MU", capital: "Port Louis", iana: "Indian/Mauritius" },
  { name: "Morocco", code: "MA", capital: "Rabat", iana: "Africa/Casablanca" },
  { name: "Mozambique", code: "MZ", capital: "Maputo", iana: "Africa/Maputo" },
  { name: "Namibia", code: "NA", capital: "Windhoek", iana: "Africa/Windhoek" },
  { name: "Niger", code: "NE", capital: "Niamey", iana: "Africa/Niamey" },
  { name: "Nigeria", code: "NG", capital: "Abuja", iana: "Africa/Lagos" },
  { name: "Rwanda", code: "RW", capital: "Kigali", iana: "Africa/Kigali" },
  { name: "São Tomé and Príncipe", code: "ST", capital: "São Tomé", iana: "Africa/Sao_Tome" },
  { name: "Senegal", code: "SN", capital: "Dakar", iana: "Africa/Dakar" },
  { name: "Seychelles", code: "SC", capital: "Victoria", iana: "Indian/Mahe" },
  { name: "Sierra Leone", code: "SL", capital: "Freetown", iana: "Africa/Freetown" },
  { name: "Somalia", code: "SO", capital: "Mogadishu", iana: "Africa/Mogadishu" },
  { name: "South Africa", code: "ZA", capital: "Pretoria", iana: "Africa/Johannesburg" },
  { name: "South Sudan", code: "SS", capital: "Juba", iana: "Africa/Juba" },
  { name: "Sudan", code: "SD", capital: "Khartoum", iana: "Africa/Khartoum" },
  { name: "Tanzania", code: "TZ", capital: "Dodoma", iana: "Africa/Dar_es_Salaam" },
  { name: "Togo", code: "TG", capital: "Lomé", iana: "Africa/Lome" },
  { name: "Tunisia", code: "TN", capital: "Tunis", iana: "Africa/Tunis" },
  { name: "Uganda", code: "UG", capital: "Kampala", iana: "Africa/Kampala" },
  { name: "Zambia", code: "ZM", capital: "Lusaka", iana: "Africa/Lusaka" },
  { name: "Zimbabwe", code: "ZW", capital: "Harare", iana: "Africa/Harare" },

  // ── Americas ──
  { name: "Antigua and Barbuda", code: "AG", capital: "St. John's", iana: "America/Antigua" },
  { name: "Argentina", code: "AR", capital: "Buenos Aires", iana: "America/Argentina/Buenos_Aires" },
  { name: "Bahamas", code: "BS", capital: "Nassau", iana: "America/Nassau" },
  { name: "Barbados", code: "BB", capital: "Bridgetown", iana: "America/Barbados" },
  { name: "Belize", code: "BZ", capital: "Belmopan", iana: "America/Belize" },
  { name: "Bolivia", code: "BO", capital: "La Paz", iana: "America/La_Paz" },
  { name: "Brazil", code: "BR", capital: "Brasília", iana: "America/Sao_Paulo" },
  { name: "Canada", code: "CA", capital: "Ottawa", iana: "America/Toronto" },
  { name: "Chile", code: "CL", capital: "Santiago", iana: "America/Santiago" },
  { name: "Colombia", code: "CO", capital: "Bogotá", iana: "America/Bogota" },
  { name: "Costa Rica", code: "CR", capital: "San José", iana: "America/Costa_Rica" },
  { name: "Cuba", code: "CU", capital: "Havana", iana: "America/Havana" },
  { name: "Dominica", code: "DM", capital: "Roseau", iana: "America/Dominica" },
  { name: "Dominican Republic", code: "DO", capital: "Santo Domingo", iana: "America/Santo_Domingo" },
  { name: "Ecuador", code: "EC", capital: "Quito", iana: "America/Guayaquil" },
  { name: "El Salvador", code: "SV", capital: "San Salvador", iana: "America/El_Salvador" },
  { name: "Grenada", code: "GD", capital: "St. George's", iana: "America/Grenada" },
  { name: "Guatemala", code: "GT", capital: "Guatemala City", iana: "America/Guatemala" },
  { name: "Guyana", code: "GY", capital: "Georgetown", iana: "America/Guyana" },
  { name: "Haiti", code: "HT", capital: "Port-au-Prince", iana: "America/Port-au-Prince" },
  { name: "Honduras", code: "HN", capital: "Tegucigalpa", iana: "America/Tegucigalpa" },
  { name: "Jamaica", code: "JM", capital: "Kingston", iana: "America/Jamaica" },
  { name: "Mexico", code: "MX", capital: "Mexico City", iana: "America/Mexico_City" },
  { name: "Nicaragua", code: "NI", capital: "Managua", iana: "America/Managua" },
  { name: "Panama", code: "PA", capital: "Panama City", iana: "America/Panama" },
  { name: "Paraguay", code: "PY", capital: "Asunción", iana: "America/Asuncion" },
  { name: "Peru", code: "PE", capital: "Lima", iana: "America/Lima" },
  { name: "Saint Kitts and Nevis", code: "KN", capital: "Basseterre", iana: "America/St_Kitts" },
  { name: "Saint Lucia", code: "LC", capital: "Castries", iana: "America/St_Lucia" },
  { name: "Saint Vincent and the Grenadines", code: "VC", capital: "Kingstown", iana: "America/St_Vincent" },
  { name: "Suriname", code: "SR", capital: "Paramaribo", iana: "America/Paramaribo" },
  { name: "Trinidad and Tobago", code: "TT", capital: "Port of Spain", iana: "America/Port_of_Spain" },
  { name: "United States", code: "US", capital: "Washington, D.C.", iana: "America/New_York" },
  { name: "Uruguay", code: "UY", capital: "Montevideo", iana: "America/Montevideo" },
  { name: "Venezuela", code: "VE", capital: "Caracas", iana: "America/Caracas" },

  // ── Asia ──
  { name: "Afghanistan", code: "AF", capital: "Kabul", iana: "Asia/Kabul" },
  { name: "Armenia", code: "AM", capital: "Yerevan", iana: "Asia/Yerevan" },
  { name: "Azerbaijan", code: "AZ", capital: "Baku", iana: "Asia/Baku" },
  { name: "Bahrain", code: "BH", capital: "Manama", iana: "Asia/Bahrain" },
  { name: "Bangladesh", code: "BD", capital: "Dhaka", iana: "Asia/Dhaka" },
  { name: "Bhutan", code: "BT", capital: "Thimphu", iana: "Asia/Thimphu" },
  { name: "Brunei", code: "BN", capital: "Bandar Seri Begawan", iana: "Asia/Brunei" },
  { name: "Cambodia", code: "KH", capital: "Phnom Penh", iana: "Asia/Phnom_Penh" },
  { name: "China", code: "CN", capital: "Beijing", iana: "Asia/Shanghai" },
  { name: "Cyprus", code: "CY", capital: "Nicosia", iana: "Asia/Nicosia" },
  { name: "Georgia", code: "GE", capital: "Tbilisi", iana: "Asia/Tbilisi" },
  { name: "India", code: "IN", capital: "New Delhi", iana: "Asia/Kolkata" },
  { name: "Indonesia", code: "ID", capital: "Jakarta", iana: "Asia/Jakarta" },
  { name: "Iran", code: "IR", capital: "Tehran", iana: "Asia/Tehran" },
  { name: "Iraq", code: "IQ", capital: "Baghdad", iana: "Asia/Baghdad" },
  { name: "Israel", code: "IL", capital: "Jerusalem", iana: "Asia/Jerusalem" },
  { name: "Japan", code: "JP", capital: "Tokyo", iana: "Asia/Tokyo" },
  { name: "Jordan", code: "JO", capital: "Amman", iana: "Asia/Amman" },
  { name: "Kazakhstan", code: "KZ", capital: "Astana", iana: "Asia/Almaty" },
  { name: "Kuwait", code: "KW", capital: "Kuwait City", iana: "Asia/Kuwait" },
  { name: "Kyrgyzstan", code: "KG", capital: "Bishkek", iana: "Asia/Bishkek" },
  { name: "Laos", code: "LA", capital: "Vientiane", iana: "Asia/Vientiane" },
  { name: "Lebanon", code: "LB", capital: "Beirut", iana: "Asia/Beirut" },
  { name: "Malaysia", code: "MY", capital: "Kuala Lumpur", iana: "Asia/Kuala_Lumpur" },
  { name: "Maldives", code: "MV", capital: "Malé", iana: "Indian/Maldives" },
  { name: "Mongolia", code: "MN", capital: "Ulaanbaatar", iana: "Asia/Ulaanbaatar" },
  { name: "Myanmar", code: "MM", capital: "Naypyidaw", iana: "Asia/Yangon" },
  { name: "Nepal", code: "NP", capital: "Kathmandu", iana: "Asia/Kathmandu" },
  { name: "North Korea", code: "KP", capital: "Pyongyang", iana: "Asia/Pyongyang" },
  { name: "Oman", code: "OM", capital: "Muscat", iana: "Asia/Muscat" },
  { name: "Pakistan", code: "PK", capital: "Islamabad", iana: "Asia/Karachi" },
  { name: "Palestine", code: "PS", capital: "Ramallah", iana: "Asia/Gaza" },
  { name: "Philippines", code: "PH", capital: "Manila", iana: "Asia/Manila" },
  { name: "Qatar", code: "QA", capital: "Doha", iana: "Asia/Qatar" },
  { name: "Saudi Arabia", code: "SA", capital: "Riyadh", iana: "Asia/Riyadh" },
  { name: "Singapore", code: "SG", capital: "Singapore", iana: "Asia/Singapore" },
  { name: "South Korea", code: "KR", capital: "Seoul", iana: "Asia/Seoul" },
  { name: "Sri Lanka", code: "LK", capital: "Colombo", iana: "Asia/Colombo" },
  { name: "Syria", code: "SY", capital: "Damascus", iana: "Asia/Damascus" },
  { name: "Taiwan", code: "TW", capital: "Taipei", iana: "Asia/Taipei" },
  { name: "Tajikistan", code: "TJ", capital: "Dushanbe", iana: "Asia/Dushanbe" },
  { name: "Thailand", code: "TH", capital: "Bangkok", iana: "Asia/Bangkok" },
  { name: "Timor-Leste", code: "TL", capital: "Dili", iana: "Asia/Dili" },
  { name: "Turkey", code: "TR", capital: "Ankara", iana: "Europe/Istanbul" },
  { name: "Turkmenistan", code: "TM", capital: "Ashgabat", iana: "Asia/Ashgabat" },
  { name: "United Arab Emirates", code: "AE", capital: "Abu Dhabi", iana: "Asia/Dubai" },
  { name: "Uzbekistan", code: "UZ", capital: "Tashkent", iana: "Asia/Tashkent" },
  { name: "Vietnam", code: "VN", capital: "Hanoi", iana: "Asia/Bangkok" },
  { name: "Yemen", code: "YE", capital: "Sana'a", iana: "Asia/Aden" },

  // ── Europe ──
  { name: "Albania", code: "AL", capital: "Tirana", iana: "Europe/Tirane" },
  { name: "Andorra", code: "AD", capital: "Andorra la Vella", iana: "Europe/Andorra" },
  { name: "Austria", code: "AT", capital: "Vienna", iana: "Europe/Vienna" },
  { name: "Belarus", code: "BY", capital: "Minsk", iana: "Europe/Minsk" },
  { name: "Belgium", code: "BE", capital: "Brussels", iana: "Europe/Brussels" },
  { name: "Bosnia and Herzegovina", code: "BA", capital: "Sarajevo", iana: "Europe/Sarajevo" },
  { name: "Bulgaria", code: "BG", capital: "Sofia", iana: "Europe/Sofia" },
  { name: "Croatia", code: "HR", capital: "Zagreb", iana: "Europe/Zagreb" },
  { name: "Czechia", code: "CZ", capital: "Prague", iana: "Europe/Prague" },
  { name: "Denmark", code: "DK", capital: "Copenhagen", iana: "Europe/Copenhagen" },
  { name: "Estonia", code: "EE", capital: "Tallinn", iana: "Europe/Tallinn" },
  { name: "Finland", code: "FI", capital: "Helsinki", iana: "Europe/Helsinki" },
  { name: "France", code: "FR", capital: "Paris", iana: "Europe/Paris" },
  { name: "Germany", code: "DE", capital: "Berlin", iana: "Europe/Berlin" },
  { name: "Greece", code: "GR", capital: "Athens", iana: "Europe/Athens" },
  { name: "Hungary", code: "HU", capital: "Budapest", iana: "Europe/Budapest" },
  { name: "Iceland", code: "IS", capital: "Reykjavik", iana: "Atlantic/Reykjavik" },
  { name: "Ireland", code: "IE", capital: "Dublin", iana: "Europe/Dublin" },
  { name: "Italy", code: "IT", capital: "Rome", iana: "Europe/Rome" },
  { name: "Kosovo", code: "XK", capital: "Pristina", iana: "Europe/Belgrade" },
  { name: "Latvia", code: "LV", capital: "Riga", iana: "Europe/Riga" },
  { name: "Liechtenstein", code: "LI", capital: "Vaduz", iana: "Europe/Vaduz" },
  { name: "Lithuania", code: "LT", capital: "Vilnius", iana: "Europe/Vilnius" },
  { name: "Luxembourg", code: "LU", capital: "Luxembourg", iana: "Europe/Luxembourg" },
  { name: "Malta", code: "MT", capital: "Valletta", iana: "Europe/Malta" },
  { name: "Moldova", code: "MD", capital: "Chișinău", iana: "Europe/Chisinau" },
  { name: "Monaco", code: "MC", capital: "Monaco", iana: "Europe/Monaco" },
  { name: "Montenegro", code: "ME", capital: "Podgorica", iana: "Europe/Podgorica" },
  { name: "Netherlands", code: "NL", capital: "Amsterdam", iana: "Europe/Amsterdam" },
  { name: "North Macedonia", code: "MK", capital: "Skopje", iana: "Europe/Skopje" },
  { name: "Norway", code: "NO", capital: "Oslo", iana: "Europe/Oslo" },
  { name: "Poland", code: "PL", capital: "Warsaw", iana: "Europe/Warsaw" },
  { name: "Portugal", code: "PT", capital: "Lisbon", iana: "Europe/Lisbon" },
  { name: "Romania", code: "RO", capital: "Bucharest", iana: "Europe/Bucharest" },
  { name: "Russia", code: "RU", capital: "Moscow", iana: "Europe/Moscow" },
  { name: "San Marino", code: "SM", capital: "San Marino", iana: "Europe/San_Marino" },
  { name: "Serbia", code: "RS", capital: "Belgrade", iana: "Europe/Belgrade" },
  { name: "Slovakia", code: "SK", capital: "Bratislava", iana: "Europe/Bratislava" },
  { name: "Slovenia", code: "SI", capital: "Ljubljana", iana: "Europe/Ljubljana" },
  { name: "Spain", code: "ES", capital: "Madrid", iana: "Europe/Madrid" },
  { name: "Sweden", code: "SE", capital: "Stockholm", iana: "Europe/Stockholm" },
  { name: "Switzerland", code: "CH", capital: "Bern", iana: "Europe/Zurich" },
  { name: "Ukraine", code: "UA", capital: "Kyiv", iana: "Europe/Kyiv" },
  { name: "United Kingdom", code: "GB", capital: "London", iana: "Europe/London" },
  { name: "Vatican City", code: "VA", capital: "Vatican City", iana: "Europe/Vatican" },

  // ── Oceania ──
  { name: "Australia", code: "AU", capital: "Canberra", iana: "Australia/Sydney" },
  { name: "Fiji", code: "FJ", capital: "Suva", iana: "Pacific/Fiji" },
  { name: "Kiribati", code: "KI", capital: "Tarawa", iana: "Pacific/Tarawa" },
  { name: "Marshall Islands", code: "MH", capital: "Majuro", iana: "Pacific/Majuro" },
  { name: "Micronesia", code: "FM", capital: "Palikir", iana: "Pacific/Pohnpei" },
  { name: "Nauru", code: "NR", capital: "Yaren", iana: "Pacific/Nauru" },
  { name: "New Zealand", code: "NZ", capital: "Wellington", iana: "Pacific/Auckland" },
  { name: "Palau", code: "PW", capital: "Ngerulmud", iana: "Pacific/Palau" },
  { name: "Papua New Guinea", code: "PG", capital: "Port Moresby", iana: "Pacific/Port_Moresby" },
  { name: "Samoa", code: "WS", capital: "Apia", iana: "Pacific/Apia" },
  { name: "Solomon Islands", code: "SB", capital: "Honiara", iana: "Pacific/Guadalcanal" },
  { name: "Tonga", code: "TO", capital: "Nukuʻalofa", iana: "Pacific/Tongatapu" },
  { name: "Tuvalu", code: "TV", capital: "Funafuti", iana: "Pacific/Funafuti" },
  { name: "Vanuatu", code: "VU", capital: "Port Vila", iana: "Pacific/Efate" },

  // ── Common territories / regions (not UN members but useful) ──
  { name: "Hong Kong", code: "HK", capital: "Hong Kong", iana: "Asia/Hong_Kong" },
  { name: "Macau", code: "MO", capital: "Macau", iana: "Asia/Macau" },
  { name: "Puerto Rico", code: "PR", capital: "San Juan", iana: "America/Puerto_Rico" },
  { name: "Greenland", code: "GL", capital: "Nuuk", iana: "America/Godthab" },
  { name: "Guam", code: "GU", capital: "Hagåtña", iana: "Pacific/Guam" },
  { name: "French Polynesia", code: "PF", capital: "Papeete", iana: "Pacific/Tahiti" },
  { name: "New Caledonia", code: "NC", capital: "Nouméa", iana: "Pacific/Noumea" },
  { name: "Faroe Islands", code: "FO", capital: "Tórshavn", iana: "Atlantic/Faroe" },
  { name: "Gibraltar", code: "GI", capital: "Gibraltar", iana: "Europe/Gibraltar" },
  { name: "Reunion", code: "RE", capital: "Saint-Denis", iana: "Indian/Reunion" },
];

const COUNTRY_BY_CODE: Record<string, CountryEntry> = Object.fromEntries(
  COUNTRY_CATALOG.map((c) => [c.code, c]),
);

const COUNTRY_BY_IANA: Record<string, CountryEntry> = (() => {
  const m: Record<string, CountryEntry> = {};
  for (const c of COUNTRY_CATALOG) {
    // First country to claim an IANA wins (intentional for shared zones like Asia/Bangkok).
    if (!m[c.iana]) m[c.iana] = c;
  }
  return m;
})();

/**
 * Search countries by name, ISO code, or capital. Case-insensitive.
 * Empty query returns the first `limit` entries (alphabetical by name).
 */
export function searchCountries(query: string, limit = 8): CountryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...COUNTRY_CATALOG]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
  }
  const scored: Array<{ c: CountryEntry; score: number }> = [];
  for (const c of COUNTRY_CATALOG) {
    const name = c.name.toLowerCase();
    const code = c.code.toLowerCase();
    const capital = c.capital.toLowerCase();
    let score = 0;
    if (name === q || code === q) score = 100;
    else if (name.startsWith(q) || code.startsWith(q)) score = 80;
    else if (capital.startsWith(q)) score = 70;
    else if (name.includes(q)) score = 50;
    else if (capital.includes(q) || code.includes(q)) score = 40;
    if (score > 0) scored.push({ c, score });
  }
  scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
  return scored.slice(0, limit).map((x) => x.c);
}

/** Lookup a country by its ISO 3166-1 alpha-2 code. */
export function countryByCode(code: string): CountryEntry | undefined {
  return COUNTRY_BY_CODE[code.toUpperCase()];
}

/** Lookup a country by the IANA zone it claims as its primary. */
export function countryByIana(iana: string): CountryEntry | undefined {
  return COUNTRY_BY_IANA[iana];
}
