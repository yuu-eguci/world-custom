import { describe, expect, it, vi } from 'vitest';
import { initMap } from '../src/lib/map';
import { createWindow } from './helpers/dom';

interface GeocodeResponse {
  readonly results: { geometry: { location: unknown } }[] | null;
  readonly status: string;
}

/**
 * google.maps の必要な部分だけを持つ記録用のモックを作ります。
 */
function createFakeMaps(response: GeocodeResponse) {
  const log = {
    maps: [] as { element: unknown; options: unknown }[],
    centers: [] as unknown[],
    markers: [] as unknown[],
    geocodeRequests: [] as unknown[],
    mapTypes: [] as [string, unknown][],
    mapTypeIds: [] as string[],
  };
  const fake = {
    LatLng: class {
      constructor(
        readonly lat: number,
        readonly lng: number,
      ) {}
    },
    Map: class {
      readonly mapTypes = {
        set: (id: string, mapType: unknown) => {
          log.mapTypes.push([id, mapType]);
        },
      };
      constructor(element: unknown, options: unknown) {
        log.maps.push({ element, options });
      }
      setCenter(center: unknown): void {
        log.centers.push(center);
      }
      setMapTypeId(id: string): void {
        log.mapTypeIds.push(id);
      }
    },
    Geocoder: class {
      geocode(request: unknown, callback: (results: GeocodeResponse['results'], status: string) => void): Promise<void> {
        log.geocodeRequests.push(request);
        callback(response.results, response.status);
        return Promise.resolve();
      }
    },
    Marker: vi.fn(function (options: unknown) {
      log.markers.push(options);
    }),
    StyledMapType: class {
      constructor(
        readonly styles: unknown,
        readonly options: unknown,
      ) {}
    },
    MapTypeId: { ROADMAP: 'roadmap' },
    Animation: { BOUNCE: 1 },
  };
  return { maps: fake as unknown as typeof google.maps, log };
}

function setup(response: GeocodeResponse) {
  const win = createWindow('<div id="googleMap" class="googleMap"></div>');
  const { maps, log } = createFakeMaps(response);
  const alert = vi.fn<(message: string) => void>();
  initMap(maps, win.document, alert);
  return { win, log, alert };
}

describe('initMap', () => {
  it('#googleMap にグレースケールの地図を従来の設定で作ります', () => {
    const { win, log } = setup({ results: [], status: 'ZERO_RESULTS' });

    expect(log.maps).toHaveLength(1);
    expect(log.maps[0]?.element).toBe(win.document.getElementById('googleMap'));
    expect(log.maps[0]?.options).toEqual({
      zoom: 15,
      center: { lat: 56.9496, lng: 24.1052 },
      scrollwheel: false,
      scaleControl: false,
      disableDefaultUI: true,
      mapTypeControlOptions: { mapTypeIds: ['roadmap', 'gMap'] },
    });
    expect(log.mapTypes).toEqual([
      [
        'gMap',
        {
          styles: [{ featureType: 'all', elementType: 'all', stylers: [{ saturation: -25 }] }],
          options: { name: 'Grayscale' },
        },
      ],
    ]);
    expect(log.mapTypeIds).toEqual(['gMap']);
  });

  it('Riga のジオコーディングに成功すると中心を移してマーカーを置きます', () => {
    const location = { lat: 1, lng: 2 };
    const { log, alert } = setup({ results: [{ geometry: { location } }], status: 'OK' });

    expect(log.geocodeRequests).toEqual([{ address: 'Riga' }]);
    expect(log.centers).toEqual([location]);
    expect(log.markers).toHaveLength(1);
    expect(log.markers[0]).toMatchObject({ icon: '', position: location, animation: 1 });
    expect(alert).not.toHaveBeenCalled();
  });

  it('ジオコーディングに失敗すると理由を alert で表示します', () => {
    const { log, alert } = setup({ results: null, status: 'REQUEST_DENIED' });

    expect(log.centers).toEqual([]);
    expect(log.markers).toEqual([]);
    expect(alert).toHaveBeenCalledWith('Geocode was not successful for the following reason: REQUEST_DENIED');
  });
});
