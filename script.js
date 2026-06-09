// Initialize map
const map = L.map('map').setView([14.5995, 120.9842], 13);

// OpenStreetMap layer
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap'
    }
).addTo(map);

// Custom marker icons
const startIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [40,40],
    iconAnchor: [20,40],
    popupAnchor: [0,-35]
});

const destinationIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [40,40],
    iconAnchor: [20,40],
    popupAnchor: [0,-35]
});

let originMarker = null;
let destinationMarker = null;

let clickCount = 0;

let currentRouteLayer = null;

let routes = [];

// Create route variations
function generateRoutes(start,end){

    const midLat =
        (start.lat + end.lat) / 2;

    const midLng =
        (start.lng + end.lng) / 2;

    return [

        [
            [start.lat,start.lng],
            [midLat + 0.01,midLng],
            [end.lat,end.lng]
        ],

        [
            [start.lat,start.lng],
            [midLat,midLng + 0.02],
            [end.lat,end.lng]
        ],

        [
            [start.lat,start.lng],
            [midLat - 0.015,midLng - 0.01],
            [end.lat,end.lng]
        ]

    ];
}

// Draw selected route
function drawRoute(index){

    if(!originMarker || !destinationMarker){
        return;
    }

    if(currentRouteLayer){
        map.removeLayer(currentRouteLayer);
    }

    const colors = [
        "#00a884",
        "#0984e3",
        "#f39c12"
    ];

    currentRouteLayer = L.polyline(
        routes[index],
        {
            color: colors[index],
            weight: 7
        }
    ).addTo(map);

    map.fitBounds(
        currentRouteLayer.getBounds(),
        {
            padding:[50,50]
        }
    );
}

// Map click event
map.on('click', function(e){

    if(clickCount === 0){

        originMarker = L.marker(
            e.latlng,
            {
                icon:startIcon
            }
        )
        .addTo(map)
        .bindPopup("Starting Point")
        .openPopup();

        clickCount++;

    }

    else if(clickCount === 1){

        destinationMarker = L.marker(
            e.latlng,
            {
                icon:destinationIcon
            }
        )
        .addTo(map)
        .bindPopup("Destination")
        .openPopup();

        clickCount++;

        const start =
            originMarker.getLatLng();

        const end =
            destinationMarker.getLatLng();

        routes = generateRoutes(
            start,
            end
        );

        drawRoute(0);
    }

});

// Route cards
document
.querySelectorAll('.route-card')
.forEach(card => {

    card.addEventListener(
        'click',
        () => {

            document
            .querySelectorAll('.route-card')
            .forEach(c =>
                c.classList.remove('active')
            );

            card.classList.add('active');

            const routeIndex =
                parseInt(
                    card.dataset.route
                );

            drawRoute(routeIndex);
        }
    );

});

// Reset button
document
.getElementById('resetBtn')
.addEventListener('click', () => {

    if(originMarker){
        map.removeLayer(originMarker);
    }

    if(destinationMarker){
        map.removeLayer(destinationMarker);
    }

    if(currentRouteLayer){
        map.removeLayer(currentRouteLayer);
    }

    originMarker = null;
    destinationMarker = null;

    routes = [];

    clickCount = 0;

});
