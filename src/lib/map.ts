const CENTER = { lat: 56.9496, lng: 24.1052 };
const ADDRESS = 'Riga';
const GRAYSCALE_MAP_TYPE_ID = 'gMap';

/**
 * contact.html の #googleMap に、 Riga を中心としたグレースケールの地図を表示します。
 */
export function initMap(maps: typeof google.maps, doc: Document, alert: (message: string) => void): google.maps.Map {
  const element = doc.getElementById('googleMap');
  if (element === null) {
    throw new Error('#googleMap が見つかりません。');
  }

  const map = new maps.Map(element, {
    zoom: 15,
    center: new maps.LatLng(CENTER.lat, CENTER.lng),
    scrollwheel: false,
    scaleControl: false,
    disableDefaultUI: true,
    mapTypeControlOptions: {
      mapTypeIds: [maps.MapTypeId.ROADMAP, GRAYSCALE_MAP_TYPE_ID],
    },
  });

  // 結果はコールバックで扱います。
  void new maps.Geocoder().geocode({ address: ADDRESS }, (results, status) => {
    const location = results?.[0]?.geometry.location;
    if (status === 'OK' && location !== undefined) {
      map.setCenter(location);
      // テンプレートと同じ BOUNCE アニメーションを使うため、 AdvancedMarkerElement ではなく Marker を使います。
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      new maps.Marker({
        map,
        icon: '',
        position: location,
        animation: maps.Animation.BOUNCE,
      });
    } else {
      alert(`Geocode was not successful for the following reason: ${status}`);
    }
  });

  const grayscale = new maps.StyledMapType([{ featureType: 'all', elementType: 'all', stylers: [{ saturation: -25 }] }], {
    name: 'Grayscale',
  });
  map.mapTypes.set(GRAYSCALE_MAP_TYPE_ID, grayscale);
  map.setMapTypeId(GRAYSCALE_MAP_TYPE_ID);
  return map;
}
