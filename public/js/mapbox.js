/* ellist-disable  */
export const displayMap = (locations) => {
  const zoomLevel = 13;
  let boundList = [];

  let popUp = L.popup()
  let map = L.map('map').setView([36.260462, 59.616754], zoomLevel);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: zoomLevel,
    attribution: '©OpenStreetMap'
  }).addTo(map);

  locations.forEach(loc => {
    const marker = L.marker([loc.coordinates[1], loc.coordinates[0]]).addTo(map);
    const bounds = [loc.coordinates[1], loc.coordinates[0]];
    boundList.push(bounds);

    marker.on('click', e => {
      popUp
        .setLatLng(e.latlng)
        .setContent(loc.description)
        .openOn(map);
    });

  });
  map.fitBounds(boundList);
}