/* src/ から npm run build で生成したファイルです。直接編集しません。 */
"use strict";
(() => {
  // src/lib/map.ts
  var CENTER = { lat: 56.9496, lng: 24.1052 };
  var ADDRESS = "Riga";
  var GRAYSCALE_MAP_TYPE_ID = "gMap";
  function initMap(maps, doc, alert) {
    const element = doc.getElementById("googleMap");
    if (element === null) {
      throw new Error("#googleMap が見つかりません。");
    }
    const map = new maps.Map(element, {
      zoom: 15,
      center: new maps.LatLng(CENTER.lat, CENTER.lng),
      scrollwheel: false,
      scaleControl: false,
      disableDefaultUI: true,
      mapTypeControlOptions: {
        mapTypeIds: [maps.MapTypeId.ROADMAP, GRAYSCALE_MAP_TYPE_ID]
      }
    });
    void new maps.Geocoder().geocode({ address: ADDRESS }, (results, status) => {
      const location = results?.[0]?.geometry.location;
      if (status === "OK" && location !== void 0) {
        map.setCenter(location);
        new maps.Marker({
          map,
          icon: "",
          position: location,
          animation: maps.Animation.BOUNCE
        });
      } else {
        alert(`Geocode was not successful for the following reason: ${status}`);
      }
    });
    const grayscale = new maps.StyledMapType([{ featureType: "all", elementType: "all", stylers: [{ saturation: -25 }] }], {
      name: "Grayscale"
    });
    map.mapTypes.set(GRAYSCALE_MAP_TYPE_ID, grayscale);
    map.setMapTypeId(GRAYSCALE_MAP_TYPE_ID);
    return map;
  }

  // src/map-active.ts
  initMap(google.maps, document, (message) => {
    window.alert(message);
  });
})();
