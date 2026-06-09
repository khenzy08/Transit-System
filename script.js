// =====================================
// TRANSIT ROUTE OPTIMIZER - PHILIPPINES
// =====================================

// MAP

const map = L.map('map').setView(
    [12.8797, 121.7740],
    6
);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
            '&copy; OpenStreetMap Contributors'
    }
).addTo(map);

// =====================================
// VARIABLES
// =====================================

let routingControl = null;

let startMarker = null;
let endMarker = null;

let selectedVehicle = "car";
let selectedRoute = "fastest";

let fromLocation = null;
let toLocation = null;

// =====================================
// CUSTOM ICONS
// =====================================

const startIcon = L.icon({
    iconUrl:
        'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

const destinationIcon = L.icon({
    iconUrl:
        'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

// =====================================
// AUTOCOMPLETE
// =====================================

let debounceTimer;

function debounce(callback, delay) {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(
        callback,
        delay
    );
}

async function searchPlaces(query) {

    if (query.length < 3) {
        return [];
    }

    try {

        const url =
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&` +
            `limit=5&` +
            `countrycodes=ph&` +
            `q=${encodeURIComponent(query)}`;

        const response =
            await fetch(url);

        return await response.json();

    }
    catch (error) {

        console.error(error);

        return [];
    }
}

function createSuggestions(
    results,
    container,
    input,
    isFrom
) {

    container.innerHTML = '';

    if (results.length === 0) {

        container.style.display = 'none';

        return;
    }

    results.forEach(place => {

        const item =
            document.createElement('div');

        item.className =
            'suggestion-item';

        item.textContent =
            place.display_name;

        item.addEventListener(
            'click',
            () => {

                input.value =
                    place.display_name;

                const selected = {
                    lat:
                        parseFloat(place.lat),
                    lng:
                        parseFloat(place.lon),
                    name:
                        place.display_name
                };

                if (isFrom) {

                    fromLocation =
                        selected;

                }
                else {

                    toLocation =
                        selected;

                }

                container.style.display =
                    'none';
            }
        );

        container.appendChild(item);
    });

    container.style.display =
        'block';
}

// =====================================
// INPUT HANDLERS
// =====================================

const fromInput =
    document.getElementById(
        'fromInput'
    );

const toInput =
    document.getElementById(
        'toInput'
    );

const fromSuggestions =
    document.getElementById(
        'fromSuggestions'
    );

const toSuggestions =
    document.getElementById(
        'toSuggestions'
    );

// FROM

fromInput.addEventListener(
    'input',
    () => {

        debounce(
            async () => {

                const results =
                    await searchPlaces(
                        fromInput.value
                    );

                createSuggestions(
                    results,
                    fromSuggestions,
                    fromInput,
                    true
                );

            },
            500
        );

    }
);

// TO

toInput.addEventListener(
    'input',
    () => {

        debounce(
            async () => {

                const results =
                    await searchPlaces(
                        toInput.value
                    );

                createSuggestions(
                    results,
                    toSuggestions,
                    toInput,
                    false
                );

            },
            500
        );

    }
);

// =====================================
// CLOSE SUGGESTIONS
// =====================================

document.addEventListener(
    'click',
    (e) => {

        if (
            !fromSuggestions.contains(
                e.target
            ) &&
            e.target !== fromInput
        ) {

            fromSuggestions.style.display =
                'none';
        }

        if (
            !toSuggestions.contains(
                e.target
            ) &&
            e.target !== toInput
        ) {

            toSuggestions.style.display =
                'none';
        }

    }
);

// =====================================
// VEHICLE SELECTION
// =====================================

document
    .querySelectorAll(
        '.vehicle-card'
    )
    .forEach(card => {

        card.addEventListener(
            'click',
            () => {

                document
                    .querySelectorAll(
                        '.vehicle-card'
                    )
                    .forEach(c =>
                        c.classList.remove(
                            'active'
                        )
                    );

                card.classList.add(
                    'active'
                );

                selectedVehicle =
                    card.dataset.vehicle;

            }
        );

    });

// =====================================
// ROUTE SELECTION
// =====================================

document
    .querySelectorAll(
        '.route-card'
    )
    .forEach(card => {

        card.addEventListener(
            'click',
            () => {

                document
                    .querySelectorAll(
                        '.route-card'
                    )
                    .forEach(c =>
                        c.classList.remove(
                            'active'
                        )
                    );

                card.classList.add(
                    'active'
                );

                selectedRoute =
                    card.dataset.route;

            }
        );

    });

// =====================================
// ROUTE COLORS
// =====================================

function getRouteColor() {

    if (
        selectedRoute ===
        'cheapest'
    ) {

        return '#0984e3';
    }

    return '#00a884';
}

// =====================================
// FIND ROUTE
// =====================================

document
    .getElementById(
        'findRouteBtn'
    )
    .addEventListener(
        'click',
        () => {

            if (
                !fromLocation ||
                !toLocation
            ) {

                alert(
                    'Please select valid locations from the suggestions.'
                );

                return;
            }

            if (routingControl) {

                map.removeControl(
                    routingControl
                );
            }

            if (startMarker) {

                map.removeLayer(
                    startMarker
                );
            }

            if (endMarker) {

                map.removeLayer(
                    endMarker
                );
            }

            startMarker =
                L.marker(
                    [
                        fromLocation.lat,
                        fromLocation.lng
                    ],
                    {
                        icon:
                            startIcon
                    }
                )
                    .addTo(map)
                    .bindPopup(
                        'Starting Point'
                    );

            endMarker =
                L.marker(
                    [
                        toLocation.lat,
                        toLocation.lng
                    ],
                    {
                        icon:
                            destinationIcon
                    }
                )
                    .addTo(map)
                    .bindPopup(
                        'Destination'
                    );

            routingControl =
                L.Routing.control({

                    waypoints: [

                        L.latLng(
                            fromLocation.lat,
                            fromLocation.lng
                        ),

                        L.latLng(
                            toLocation.lat,
                            toLocation.lng
                        )

                    ],

                    routeWhileDragging:
                        false,

                    addWaypoints:
                        false,

                    draggableWaypoints:
                        false,

                    show:
                        false,

                    createMarker:
                        () => null,

                    lineOptions: {

                        styles: [

                            {
                                color:
                                    getRouteColor(),

                                opacity:
                                    0.9,

                                weight:
                                    7
                            }

                        ]

                    }

                })
                    .on(
                        'routesfound',
                        function (e) {

                            const route =
                                e.routes[0];

                            const distanceKm =
                                (
                                    route.summary.totalDistance /
                                    1000
                                ).toFixed(
                                    2
                                );

                            const timeMinutes =
                                Math.round(
                                    route.summary.totalTime /
                                    60
                                );

                            document.getElementById(
                                'distanceText'
                            ).textContent =
                                `${distanceKm} km`;

                            document.getElementById(
                                'timeText'
                            ).textContent =
                                `${timeMinutes} min`;

                        }
                    )
                    .addTo(map);

        }
    );

// =====================================
// RESET
// =====================================

document
    .getElementById(
        'resetBtn'
    )
    .addEventListener(
        'click',
        () => {

            if (routingControl) {

                map.removeControl(
                    routingControl
                );

                routingControl =
                    null;
            }

            if (startMarker) {

                map.removeLayer(
                    startMarker
                );

                startMarker =
                    null;
            }

            if (endMarker) {

                map.removeLayer(
                    endMarker
                );

                endMarker =
                    null;
            }

            fromInput.value = '';
            toInput.value = '';

            fromLocation = null;
            toLocation = null;

            document.getElementById(
                'distanceText'
            ).textContent = '--';

            document.getElementById(
                'timeText'
            ).textContent = '--';

            map.setView(
                [12.8797, 121.7740],
                6
            );

        }
    );
