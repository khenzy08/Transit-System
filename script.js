// Create the map
var map = L.map('map').setView([14.5764, 121.1329], 13);

// Add OpenStreetMap tiles
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '© OpenStreetMap'
    }
).addTo(map);

// Route function
function findRoute() {

    const start =
        document.getElementById("start").value;

    const destination =
        document.getElementById("destination").value;

    const vehicle =
        document.getElementById("vehicle").value;

    document.getElementById("result").innerHTML =
    `
    <h3>Route Found</h3>

    <p><strong>Start:</strong> ${start}</p>

    <p><strong>Destination:</strong> ${destination}</p>

    <p><strong>Vehicle:</strong> ${vehicle}</p>

    <p><strong>Estimated Distance:</strong> 12 km</p>

    <p><strong>Estimated Time:</strong> 20 minutes</p>
    `;
}
