import { fetchNearbyVenues } from '../../lib/overpass';

// Each test uses a unique lat/lng to avoid hitting the module-level cache
let coordCounter = 0;
function uniqueCoords(): [number, number] {
  coordCounter++;
  return [10 + coordCounter, 20 + coordCounter];
}

const mockElements = [
  { id: 1, tags: { name: 'Blue Bottle', amenity: 'cafe' }, lat: 35.28, lon: -120.66 },
  { id: 2, tags: { name: 'Whole Foods', shop: 'supermarket' }, lat: 35.281, lon: -120.661 },
  { id: 3, tags: { amenity: 'bench' }, lat: 35.282, lon: -120.662 }, // no name — filtered
  {
    id: 4,
    tags: { name: 'Corner Store', shop: 'convenience', 'addr:housenumber': '123', 'addr:street': 'Main St' },
    lat: 35.283,
    lon: -120.663,
  },
];

function makeOkResponse(elements: any[]) {
  return { ok: true, json: async () => ({ elements }) } as Response;
}

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockResolvedValue(makeOkResponse(mockElements));
});

afterEach(() => jest.restoreAllMocks());

describe('fetchNearbyVenues', () => {
  it('returns venues with correct shape', async () => {
    const venues = await fetchNearbyVenues(...uniqueCoords());
    const cafe = venues.find(v => v.name === 'Blue Bottle');
    expect(cafe).toMatchObject({ osm_id: 'node/1', name: 'Blue Bottle', category: 'cafe' });
  });

  it('filters out unnamed nodes', async () => {
    const venues = await fetchNearbyVenues(...uniqueCoords());
    expect(venues.every(v => v.name)).toBe(true);
  });

  it('maps amenity to category', async () => {
    const venues = await fetchNearbyVenues(...uniqueCoords());
    expect(venues.find(v => v.name === 'Blue Bottle')?.category).toBe('cafe');
  });

  it('maps shop to category', async () => {
    const venues = await fetchNearbyVenues(...uniqueCoords());
    expect(venues.find(v => v.name === 'Whole Foods')?.category).toBe('supermarket');
  });

  it('builds address from housenumber + street', async () => {
    const venues = await fetchNearbyVenues(...uniqueCoords());
    expect(venues.find(v => v.name === 'Corner Store')?.address).toBe('123 Main St');
  });

  it('omits address when tags absent', async () => {
    const venues = await fetchNearbyVenues(...uniqueCoords());
    expect(venues.find(v => v.name === 'Blue Bottle')?.address).toBeUndefined();
  });

  it('returns cached result on second call (same rounded coords)', async () => {
    const [lat, lng] = uniqueCoords();
    await fetchNearbyVenues(lat, lng);
    await fetchNearbyVenues(lat, lng);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('cache key rounds to 3 decimal places — same key for nearby coords', async () => {
    // Use coords that round to the same 3-decimal key
    const baseLat = 50.0;
    const baseLng = 60.0;
    await fetchNearbyVenues(baseLat + 0.0001, baseLng + 0.0001);
    await fetchNearbyVenues(baseLat + 0.0004, baseLng + 0.0004); // same rounded key
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on non-200 response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    await expect(fetchNearbyVenues(...uniqueCoords())).rejects.toThrow('Overpass API error: 500');
  });

  it('handles empty elements array', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(makeOkResponse([]));
    const venues = await fetchNearbyVenues(...uniqueCoords());
    expect(venues).toEqual([]);
  });

  it('osm_id format is node/<id>', async () => {
    const venues = await fetchNearbyVenues(...uniqueCoords());
    expect(venues[0].osm_id).toMatch(/^node\/\d+$/);
  });

  it('lat/lng at 0,0 is valid', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(makeOkResponse([
      { id: 99, tags: { name: 'Null Island Cafe', amenity: 'cafe' }, lat: 0, lon: 0 },
    ]));
    const venues = await fetchNearbyVenues(0, 0);
    expect(venues[0].lat).toBe(0);
    expect(venues[0].lng).toBe(0);
  });
});
