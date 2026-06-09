// Create map
var map = L.map('map').setView([14.5764, 121.1329], 13);

// OpenStreetMap tiles
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '© OpenStreetMap'
    }
).addTo(map);

// Variables
let startMarker = null;
let destinationMarker = null;
let routeLine = null;

// Click on map
map.on('click', function(e) {

    // First click = Start Point
    if (!startMarker) {

        startMarker = L.marker(e.latlng)
            .addTo(map)
            .bindPopup("📍 Start Point")
            .openPopup();

        document.getElementById("result").innerHTML =
            "<h3>Start Point Selected</h3><p>Now click the map again to choose the destination.</p>";

    }

    // Second click = Destination
    else if (!destinationMarker) {

        destinationMarker = L.marker(e.latlng)
            .addTo(map)
            .bindPopup("🎯 Destination")
            .openPopup();

        // Draw line
        routeLine = L.polyline(
            [
                startMarker.getLatLng(),
                destinationMarker.getLatLng()
            ],
            {
                weight: 5
            }
        ).addTo(map);

        // Zoom to fit route
        map.fitBounds(routeLine.getBounds());

        // Calculate distance
        const distance =
            startMarker.getLatLng().distanceTo(
                destinationMarker.getLatLng()
            ) / 1000;

        document.getElementById("result").innerHTML = `
            <h3>Route Created ✅</h3>

            <p><strong>Distance:</strong>
            ${distance.toFixed(2)} km</p>

            <p>📍 Start Point Selected</p>

            <p>🎯 Destination Selected</p>
        `;
    }
});

// Reset route when button clicked
function findRoute() {

    if(startMarker){
        map.removeLayer(startMarker);
        startMarker = null;
    }

    if(destinationMarker){
        map.removeLayer(destinationMarker);
        destinationMarker = null;
    }

    if(routeLine){
        map.removeLayer(routeLine);
        routeLine = null;
    }

    document.getElementById("result").innerHTML =
        "<h3>Ready</h3><p>Click the map to select a start point.</p>";
}
