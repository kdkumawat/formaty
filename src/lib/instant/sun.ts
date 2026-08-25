/** Approximate solar elevation (degrees) using NOAA mean-sun formulae. */

const RAD = Math.PI / 180;

export interface GeoCoord {
  lat: number;
  lng: number;
}

/** Representative coordinates for catalog IANA zones. */
export const ZONE_COORDS: Record<string, GeoCoord> = {
  UTC: { lat: 0, lng: 0 },
  "Asia/Kolkata": { lat: 22.57, lng: 88.36 },
  "Europe/London": { lat: 51.51, lng: -0.13 },
  "America/New_York": { lat: 40.71, lng: -74.01 },
  "America/Los_Angeles": { lat: 34.05, lng: -118.24 },
  "America/Chicago": { lat: 41.88, lng: -87.63 },
  "America/Denver": { lat: 39.74, lng: -104.99 },
  "America/Phoenix": { lat: 33.45, lng: -112.07 },
  "America/Toronto": { lat: 43.65, lng: -79.38 },
  "America/Vancouver": { lat: 49.28, lng: -123.12 },
  "America/Mexico_City": { lat: 19.43, lng: -99.13 },
  "America/Sao_Paulo": { lat: -23.55, lng: -46.63 },
  "America/Argentina/Buenos_Aires": { lat: -34.6, lng: -58.38 },
  "America/Anchorage": { lat: 61.22, lng: -149.9 },
  "Pacific/Honolulu": { lat: 21.31, lng: -157.86 },
  "Asia/Dubai": { lat: 25.2, lng: 55.27 },
  "Asia/Singapore": { lat: 1.35, lng: 103.82 },
  "Asia/Tokyo": { lat: 35.68, lng: 139.69 },
  "Asia/Seoul": { lat: 37.57, lng: 126.98 },
  "Asia/Hong_Kong": { lat: 22.32, lng: 114.17 },
  "Asia/Shanghai": { lat: 31.23, lng: 121.47 },
  "Australia/Sydney": { lat: -33.87, lng: 151.21 },
  "Australia/Melbourne": { lat: -37.81, lng: 144.96 },
  "Pacific/Auckland": { lat: -36.85, lng: 174.76 },
  "Europe/Paris": { lat: 48.86, lng: 2.35 },
  "Europe/Berlin": { lat: 52.52, lng: 13.4 },
  "Europe/Amsterdam": { lat: 52.37, lng: 4.9 },
  "Europe/Madrid": { lat: 40.42, lng: -3.7 },
  "Europe/Rome": { lat: 41.9, lng: 12.5 },
  "Europe/Zurich": { lat: 47.38, lng: 8.54 },
  "Europe/Stockholm": { lat: 59.33, lng: 18.07 },
  "Europe/Helsinki": { lat: 60.17, lng: 24.94 },
  "Europe/Warsaw": { lat: 52.23, lng: 21.01 },
  "Europe/Istanbul": { lat: 41.01, lng: 28.98 },
  "Europe/Moscow": { lat: 55.76, lng: 37.62 },
  "Africa/Cairo": { lat: 30.04, lng: 31.24 },
  "Africa/Johannesburg": { lat: -26.2, lng: 28.05 },
  "Africa/Lagos": { lat: 6.52, lng: 3.38 },
  "Africa/Nairobi": { lat: -1.29, lng: 36.82 },
  "Asia/Jerusalem": { lat: 31.77, lng: 35.21 },
  "Asia/Riyadh": { lat: 24.71, lng: 46.68 },
  "Asia/Qatar": { lat: 25.29, lng: 51.53 },
  "Asia/Karachi": { lat: 24.86, lng: 67.0 },
  "Asia/Dhaka": { lat: 23.81, lng: 90.41 },
  "Asia/Jakarta": { lat: -6.21, lng: 106.85 },
  "Asia/Bangkok": { lat: 13.76, lng: 100.5 },
  "Asia/Ho_Chi_Minh": { lat: 10.82, lng: 106.63 },
  "Asia/Manila": { lat: 14.6, lng: 120.98 },
  "Asia/Taipei": { lat: 25.03, lng: 121.57 },
};

export function coordsForZone(iana: string): GeoCoord | null {
  return ZONE_COORDS[iana] ?? null;
}

export function solarElevationDeg(lat: number, lng: number, epochMs: number): number {
  const jd = epochMs / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = (((357.528 + 0.9856003 * n) % 360) + 360) % 360;
  const lambda = (L + 1.915 * Math.sin(g * RAD) + 0.02 * Math.sin(2 * g * RAD)) * RAD;
  const epsilon = (23.439 - 0.0000004 * n) * RAD;
  const sinDec = Math.sin(epsilon) * Math.sin(lambda);
  const dec = Math.asin(sinDec);
  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  let gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  if (gmst < 0) gmst += 24;
  const lstRad = ((gmst + lng / 15) * 15) * RAD;
  const ha = lstRad - ra;
  const latR = lat * RAD;
  const sinAlt =
    Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(ha);
  return Math.asin(Math.min(1, Math.max(-1, sinAlt))) / RAD;
}

function sunStop(elev: number): string {
  if (elev < -15) return "rgba(148, 163, 196, 0.28)";
  if (elev < -6) return "rgba(168, 180, 214, 0.22)";
  if (elev < -0.8) return "rgba(255, 168, 112, 0.42)";
  if (elev < 8) return "rgba(255, 196, 120, 0.36)";
  if (elev < 35) return "rgba(255, 224, 150, 0.28)";
  return "rgba(255, 236, 190, 0.20)";
}

export function sunGradient(startMs: number, endMs: number, coord: GeoCoord, samples = 48): string {
  const span = endMs - startMs;
  if (span <= 0) return "transparent";
  const stops: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const elev = solarElevationDeg(coord.lat, coord.lng, startMs + t * span);
    stops.push(`${sunStop(elev)} ${(t * 100).toFixed(2)}%`);
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/** True when the sun is above the horizon for `iana` at `epochMs`. Falls
 *  back to "day" when the zone has no coordinates — better than misleading
 *  the user with a false "night" callout. */
export function isDaylight(epochMs: number, iana: string): boolean {
  const coord = coordsForZone(iana);
  if (!coord) return true;
  return solarElevationDeg(coord.lat, coord.lng, epochMs) > 0;
}

/** Offset in ms from `epochMs` to the next local solar noon at `iana`.
 *  Samples the next 24h at 5-min intervals and returns the ms to the peak
 *  elevation. Returns 0 if the zone has no coordinates — caller can treat
 *  that as "no terminator" and skip rendering the column. */
export function solarNoonOffsetMs(epochMs: number, iana: string): number {
  const coord = coordsForZone(iana);
  if (!coord) return 0;
  const STEP = 5 * 60 * 1000;
  const WINDOW = 24 * 60 * 60 * 1000;
  let bestOffset = 0;
  let bestElev = -Infinity;
  for (let t = 0; t <= WINDOW; t += STEP) {
    const elev = solarElevationDeg(coord.lat, coord.lng, epochMs + t);
    if (elev > bestElev) {
      bestElev = elev;
      bestOffset = t;
    }
  }
  return bestOffset;
}

/** Aggregate solar info for the Instant page: where the noon is, and how
 *  many of the user's locations are currently in daylight. */
export function solarPosition(
  epochMs: number,
  primaryIana: string,
  allIanas: string[],
): { noonMs: number; dayCount: number; nightCount: number } {
  const noonMs = epochMs + solarNoonOffsetMs(epochMs, primaryIana);
  let dayCount = 0;
  let nightCount = 0;
  for (const z of allIanas) {
    if (isDaylight(epochMs, z)) dayCount++;
    else nightCount++;
  }
  return { noonMs, dayCount, nightCount };
}
