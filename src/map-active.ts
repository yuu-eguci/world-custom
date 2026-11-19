import { initMap } from './lib/map';

initMap(google.maps, document, (message) => {
  window.alert(message);
});
