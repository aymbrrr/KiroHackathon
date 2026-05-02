/**
 * Overpass API — query nearby venues from OpenStreetMap.
 * Free, no API key required. Rate limit: be reasonable (we cache per bounding box).
 * Limit query radius to 200m to keep responses fast.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const RADIUS_METRES = 200;

export interface OverpassVenue {
  osm_id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
}

// Simple in-memory cache keyed by "lat,lng" rounded to 3 decimal places (~111m grid)
const cache = new Map<string, { venues: OverpassVenue[]; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export async function fetchNearbyVenues(
  lat: number,
  lng: number
): Promise<OverpassVenue[]> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.venues;
  }

  const query = `
    [out:json][timeout:10];
    (
      node(around:${RADIUS_METRES},${lat},${lng})[amenity~"cafe|restaurant|bar|cinema|library|hospital|pharmacy|theatre|fast_food|pub|nightclub|community_centre|arts_centre|museum|place_of_worship|school|college|university|gym|sports_centre|swimming_pool|park"];
      node(around:${RADIUS_METRES},${lat},${lng})[shop~"supermarket|convenience|mall|department_store|clothes|books|music|electronics"];
    );
    out body;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();

  const venues: OverpassVenue[] = (data.elements ?? [])
    .filter((el: any) => el.tags?.name) // skip unnamed nodes
    .map((el: any) => ({
      osm_id: `node/${el.id}`,
      name: el.tags.name,
      category: el.tags.amenity ?? el.tags.shop ?? 'place',
      lat: el.lat,
      lng: el.lon,
      address: [el.tags['addr:housenumber'], el.tags['addr:street']]
        .filter(Boolean)
        .join(' ') || undefined,
    }));

  cache.set(key, { venues, fetchedAt: Date.now() });
  return venues;
}
