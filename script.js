// Create map
var map = L.map('map').setView([14.5995, 120.9842], 12);

// OpenStreetMap tiles
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '© OpenStreetMap'
    }
).addTo(map);

let startMarker;
let destinationMarker;
let routeLine;

// Find route button
async function findRoute() {

    const start =
        document.getElementById("start").value;

    const destination =
        document.getElementById("destination").value;

    const vehicle =
        document.getElementById("vehicle").value;

    if (!start || !destination) {

        alert("Please enter both locations.");

        return;
    }

    try {

        // Search start location
        const startResponse =
            await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(start)}`
            );

        const startData =
            await startResponse.json();

        // Search destination
        const destinationResponse =
            await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`
            );

        const destinationData =
            await destinationResponse.json();

        if (
            startData.length === 0 ||
            destinationData.length === 0
        ) {
            alert("Location not found.");
            return;
        }

        const startLat =
            parseFloat(startData[0].lat);

        const startLon =
            parseFloat(startData[0].lon);

        const destLat =
            parseFloat(destinationData[0].lat);

        const destLon =
            parseFloat(destinationData[0].lon);

        // Remove previous route
        if(startMarker)
            map.removeLayer(startMarker);

        if(destinationMarker)
            map.removeLayer(destinationMarker);

        if(routeLine)
            map.removeLayer(routeLine);

        // Start marker
        startMarker = L.marker(
            [startLat, startLon]
        ).addTo(map);

        // Destination marker
        destinationMarker = L.marker(
            [destLat, destLon]
        ).addTo(map);

        // Get route from OSRM
        const routeResponse =
            await fetch(
                `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?overview=full&geometries=geojson`
            );

        const routeData =
            await routeResponse.json();

        const routeCoordinates =
            routeData.routes[0].geometry.coordinates;

        const latlngs =
            routeCoordinates.map(coord =>
                [coord[1], coord[0]]
            );

        // Draw route
        routeLine = L.polyline(
            latlngs,
            {
                color: "blue",
                weight: 6
            }
        ).addTo(map);

        map.fitBounds(
            routeLine.getBounds()
        );

        const distance =
            (
                routeData.routes[0].distance / 1000
            ).toFixed(2);

        const duration =
            (
                routeData.routes[0].duration / 60
            ).toFixed(0);

        document.getElementById("result").innerHTML = `
            <h3>Route Found ✅</h3>

            <p><strong>Start:</strong>
            ${start}</p>

            <p><strong>Destination:</strong>
            ${destination}</p>

            <p><strong>Vehicle:</strong>
            ${vehicle}</p>

            <p><strong>Distance:</strong>
            ${distance} km</p>

            <p><strong>Estimated Time:</strong>
            ${duration} minutes</p>
        `;

    }
    catch(error) {

        console.error(error);

        alert(
            "Unable to calculate route."
        );
    }
}
