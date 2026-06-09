// =====================================
// PHILIPPINES TRANSIT ROUTE OPTIMIZER
// =====================================

// Initialize map
const map = L.map('map').setView(
    [12.8797, 121.7740], // Philippines center
    6
);

// OpenStreetMap tiles
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap'
    }
).addTo(map);

// =====================
// Custom Icons
// =====================

const startIcon = L.icon({
    iconUrl:
    'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [40,40],
    iconAnchor: [20,40]
});

const destinationIcon = L.icon({
    iconUrl:
    'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [40,40],
    iconAnchor: [20,40]
});

// =====================
// Variables
// =====================

let originMarker = null;
let destinationMarker = null;

let clickCount = 0;

let routingControl = null;

// =====================
// Create Route
// =====================

function createRoute(routeType = 0){

    if(
        !originMarker ||
        !destinationMarker
    ){
        return;
    }

    if(routingControl){
        map.removeControl(
            routingControl
        );
    }

    const start =
        originMarker.getLatLng();

    const end =
        destinationMarker.getLatLng();

    let lineColor = "#00a884";

    if(routeType === 1){
        lineColor = "#0984e3";
    }

    if(routeType === 2){
        lineColor = "#f39c12";
    }

    routingControl = L.Routing.control({

        waypoints: [
            start,
            end
        ],

        routeWhileDragging: false,

        draggableWaypoints: false,

        addWaypoints: false,

        show: false,

        fitSelectedRoutes: true,

        lineOptions: {
            styles: [
                {
                    color: lineColor,
                    opacity: 0.9,
                    weight: 7
                }
            ]
        },

        createMarker: function(){
            return null;
        }

    }).addTo(map);

}

// =====================
// Map Click Logic
// =====================

map.on('click', function(e){

    if(clickCount === 0){

        originMarker = L.marker(
            e.latlng,
            {
                icon:startIcon
            }
        )
        .addTo(map)
        .bindPopup(
            "Starting Point"
        )
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
        .bindPopup(
            "Destination"
        )
        .openPopup();

        clickCount++;

        createRoute(0);

    }

});

// =====================
// Route Cards
// =====================

document
.querySelectorAll('.route-card')
.forEach(card => {

    card.addEventListener(
        'click',
        () => {

            document
            .querySelectorAll('.route-card')
            .forEach(c =>
                c.classList.remove(
                    'active'
                )
            );

            card.classList.add(
                'active'
            );

            const routeIndex =
                parseInt(
                    card.dataset.route
                );

            createRoute(
                routeIndex
            );

        }
    );

});

// =====================
// Reset Button
// =====================

document
.getElementById(
    'resetBtn'
)
.addEventListener(
    'click',
    () => {

        if(originMarker){
            map.removeLayer(
                originMarker
            );
        }

        if(destinationMarker){
            map.removeLayer(
                destinationMarker
            );
        }

        if(routingControl){
            map.removeControl(
                routingControl
            );
        }

        originMarker = null;
        destinationMarker = null;

        clickCount = 0;

        map.setView(
            [12.8797,121.7740],
            6
        );

    }
);
