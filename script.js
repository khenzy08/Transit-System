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
let motorcycleCc = "under400";

let fromLocation = null;
let toLocation = null;
let mapPickTarget = 'from';
let isMapPickingEnabled = false;

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

                setSelectedLocation(
                    isFrom,
                    selected,
                    true
                );

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

const motorcycleOptions =
    document.getElementById(
        'motorcycleOptions'
    );

const toggleMapPickBtn =
    document.getElementById(
        'toggleMapPickBtn'
    );

const mapPickPanel =
    document.getElementById(
        'mapPickPanel'
    );

const pickFromBtn =
    document.getElementById(
        'pickFromBtn'
    );

const pickToBtn =
    document.getElementById(
        'pickToBtn'
    );

const mapPickStatus =
    document.getElementById(
        'mapPickStatus'
    );

const deselectMapPickBtn =
    document.getElementById(
        'deselectMapPickBtn'
    );

const toggleControlsBtn =
    document.getElementById(
        'toggleControlsBtn'
    );

const sidebar =
    document.querySelector(
        '.sidebar'
    );

const appContainer =
    document.querySelector(
        '.container'
    );

toggleControlsBtn.addEventListener(
    'click',
    () => {
        const isCollapsed =
            sidebar.classList.toggle(
                'controls-collapsed'
            );

        appContainer.classList.toggle(
            'controls-collapsed',
            isCollapsed
        );

        toggleControlsBtn.textContent =
            isCollapsed
                ? 'Show options'
                : 'Hide options';

        setTimeout(
            () => map.invalidateSize(),
            250
        );
    }
);

function formatPickedLocation(latlng) {
    return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
}

function setMapPickingEnabled(isEnabled) {
    isMapPickingEnabled = isEnabled;

    mapPickPanel.style.display =
        isEnabled ? 'block' : 'none';

    toggleMapPickBtn.classList.toggle(
        'active',
        isEnabled
    );

    toggleMapPickBtn.textContent =
        isEnabled
            ? 'Map picking active'
            : 'Pick from map';

    map.getContainer().style.cursor =
        isEnabled ? 'crosshair' : '';
}

function setMapPickTarget(target) {
    mapPickTarget = target;
    setMapPickingEnabled(true);

    pickFromBtn.classList.toggle(
        'active',
        target === 'from'
    );

    pickToBtn.classList.toggle(
        'active',
        target === 'to'
    );

    mapPickStatus.textContent =
        target === 'from'
            ? 'Click the map to set your starting point.'
            : 'Click the map to set your destination.';
}

function resetMapPicker() {
    mapPickTarget = 'from';

    pickFromBtn.classList.add(
        'active'
    );

    pickToBtn.classList.remove(
        'active'
    );

    mapPickStatus.textContent =
        'Click the map to set your starting point.';

    setMapPickingEnabled(false);
}

function setLocationMarker(isFrom, location) {
    const markerPosition =
        [location.lat, location.lng];

    if (isFrom) {
        if (startMarker) {
            map.removeLayer(startMarker);
        }

        startMarker = L.marker(
            markerPosition,
            { icon: startIcon }
        )
            .addTo(map)
            .bindPopup('Starting Point');

        map.panTo(markerPosition);

        return;
    }

    if (endMarker) {
        map.removeLayer(endMarker);
    }

    endMarker = L.marker(
        markerPosition,
        { icon: destinationIcon }
    )
        .addTo(map)
        .bindPopup('Destination');

    map.panTo(markerPosition);
}

function setSelectedLocation(isFrom, location, shouldPlaceMarker = false) {
    if (isFrom) {
        fromLocation = location;
        fromInput.value = location.name;
    }
    else {
        toLocation = location;
        toInput.value = location.name;
    }

    if (shouldPlaceMarker) {
        setLocationMarker(
            isFrom,
            location
        );
    }

    resetRouteState();

    document.getElementById(
        'distanceText'
    ).textContent = '--';

    document.getElementById(
        'timeText'
    ).textContent = '--';

    showRouteNote('');
}

async function reverseGeocode(latlng) {
    try {
        const url =
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&` +
            `lat=${encodeURIComponent(latlng.lat)}&` +
            `lon=${encodeURIComponent(latlng.lng)}`;

        const response =
            await fetch(url);

        const place =
            await response.json();

        return place.display_name ||
            formatPickedLocation(latlng);
    }
    catch (error) {
        console.error(error);

        return formatPickedLocation(latlng);
    }
}

async function selectLocationFromMap(latlng) {
    const isFrom =
        mapPickTarget === 'from';

    const pickedLocation = {
        lat:
            latlng.lat,
        lng:
            latlng.lng,
        name:
            formatPickedLocation(latlng)
    };

    setSelectedLocation(
        isFrom,
        pickedLocation,
        true
    );

    const displayName =
        await reverseGeocode(latlng);

    pickedLocation.name =
        displayName;

    setSelectedLocation(
        isFrom,
        pickedLocation
    );

    if (isFrom && !toLocation) {
        setMapPickTarget('to');
    }
    else if (fromLocation && toLocation) {
        setMapPickingEnabled(false);
    }
}

pickFromBtn.addEventListener(
    'click',
    () => setMapPickTarget('from')
);

pickToBtn.addEventListener(
    'click',
    () => setMapPickTarget('to')
);

fromInput.addEventListener(
    'focus',
    () => {
        mapPickTarget = 'from';

        pickFromBtn.classList.add(
            'active'
        );

        pickToBtn.classList.remove(
            'active'
        );

        mapPickStatus.textContent =
            'Click the map to set your starting point.';
    }
);

toInput.addEventListener(
    'focus',
    () => {
        mapPickTarget = 'to';

        pickToBtn.classList.add(
            'active'
        );

        pickFromBtn.classList.remove(
            'active'
        );

        mapPickStatus.textContent =
            'Click the map to set your destination.';
    }
);

toggleMapPickBtn.addEventListener(
    'click',
    () => {
        setMapPickingEnabled(
            !isMapPickingEnabled
        );
    }
);

deselectMapPickBtn.addEventListener(
    'click',
    () => setMapPickingEnabled(false)
);

map.on(
    'click',
    (event) => {
        if (!isMapPickingEnabled) {
            return;
        }

        selectLocationFromMap(event.latlng);
    }
);

// FROM

fromInput.addEventListener(
    'input',
    () => {
        fromLocation = null;

        if (startMarker) {
            map.removeLayer(startMarker);
            startMarker = null;
        }

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
        toLocation = null;

        if (endMarker) {
            map.removeLayer(endMarker);
            endMarker = null;
        }

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

function updateMotorcycleOptionsVisibility() {
    motorcycleOptions.style.display =
        selectedVehicle === 'motorcycle'
            ? 'block'
            : 'none';
}

document
    .querySelectorAll(
        'input[name="motorcycleCc"]'
    )
    .forEach(option => {

        option.addEventListener(
            'change',
            () => {

                motorcycleCc =
                    option.value;

                document
                    .querySelectorAll(
                        '.engine-option'
                    )
                    .forEach(label =>
                        label.classList.toggle(
                            'active',
                            label.contains(option) &&
                                option.checked
                        )
                    );

                resetRouteState();

                document.getElementById(
                    'distanceText'
                ).textContent = '--';

                document.getElementById(
                    'timeText'
                ).textContent = '--';

                showRouteNote('');

            }
        );

    });

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

                updateMotorcycleOptionsVisibility();

                resetRouteState();

                document.getElementById(
                    'distanceText'
                ).textContent = '--';

                document.getElementById(
                    'timeText'
                ).textContent = '--';

                showRouteNote('');

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

                if (currentRoutes.length > 0) {
                    selectedRouteIndex =
                        getDefaultRouteIndex(currentRoutes);

                    drawRoutes(currentRoutes);
                    updateRouteInfo(currentRoutes[selectedRouteIndex]);
                    renderStandardAlternates();

                    return;
                }

                clearRouteLayers();

                document.getElementById(
                    'distanceText'
                ).textContent = '--';

                document.getElementById(
                    'timeText'
                ).textContent = '--';

                showRouteNote('');
                renderStandardAlternates();

            }
        );

    });

// =====================================
// ROUTE COLORS
// =====================================

const routeLayers = [];
let currentRoutes = [];
let selectedRouteIndex = 0;
let currentDurationStrategy = 'osrm';
let currentRouteNote = '';

const standardAlternates =
    document.getElementById(
        'standardAlternates'
    );

function resetRouteState() {
    clearRouteLayers();
    currentRoutes = [];
    selectedRouteIndex = 0;

    if (standardAlternates) {
        standardAlternates.innerHTML = '';
        standardAlternates.style.display = 'none';
    }
}

function getRouteColor() {
    if (selectedRoute === 'standard') {
        return '#0984e3';
    }
    return '#00a884';
}

function getProfileForVehicle(vehicle) {
    switch (vehicle) {
        case 'bicycle':
            return 'bike';
        case 'walking':
            return 'foot';
        default:
            return 'driving';
    }
}

function getRouteExclusions(vehicle) {
    if (
        vehicle === 'motorcycle' &&
        motorcycleCc === 'under400'
    ) {
        return ['motorway'];
    }

    return [];
}

function getRoutingDescription() {
    if (
        selectedVehicle === 'motorcycle' &&
        motorcycleCc === 'under400'
    ) {
        return 'Under 400cc motorcycle route can use regular highways, but avoids configured pay-toll roads.';
    }

    if (selectedVehicle === 'bicycle') {
        return 'Bicycle route may use regular highways where allowed, but avoids configured pay-toll roads.';
    }

    if (selectedVehicle === 'walking') {
        return 'Walking route may use regular highways where allowed, but avoids configured pay-toll roads.';
    }

    return '';
}

function isTollEligibleVehicle() {
    return selectedVehicle === 'car' ||
        (
            selectedVehicle === 'motorcycle' &&
            motorcycleCc === 'over400'
        );
}

function getEstimatedLocalMotorcycleDuration(route) {
    const localRoadSpeedKph = 35;
    const metersPerSecond =
        (localRoadSpeedKph * 1000) / 3600;

    return route.distance / metersPerSecond;
}

function getDistanceBasedDuration(route, speedKph) {
    const metersPerSecond =
        (speedKph * 1000) / 3600;

    return route.distance / metersPerSecond;
}

function getAdjustedRouteDuration(route) {
    if (
        selectedVehicle === 'motorcycle' &&
        motorcycleCc === 'under400'
    ) {
        return getDistanceBasedDuration(route, 35);
    }

    if (selectedVehicle === 'bicycle') {
        return getDistanceBasedDuration(route, 16);
    }

    if (selectedVehicle === 'walking') {
        return getDistanceBasedDuration(route, 5);
    }

    if (
        selectedVehicle === 'motorcycle' &&
        motorcycleCc === 'over400'
    ) {
        return route.duration * 0.72;
    }

    if (currentDurationStrategy === 'profileActual') {
        return route.duration;
    }

    if (currentDurationStrategy === 'localMotorcycleEstimate') {
        return getEstimatedLocalMotorcycleDuration(route);
    }

    return route.duration *
        getVehicleDurationMultiplier(selectedVehicle);
}

function getRouteStepText(step) {
    return [
        step.name,
        step.ref,
        step.destinations,
        step.exits,
        step.classes?.join(' ')
    ]
        .filter(Boolean)
        .join(' ');
}

function routeHasTollRoad(route) {
    const tollPattern =
        /\b(slex|skyway|tplex|naiax|mcx)\b|star\s+tollway/i;

    return route.legs?.some(leg =>
        leg.steps?.some(step =>
            tollPattern.test(getRouteStepText(step))
        )
    ) || false;
}

function dedupeRoutes(routes) {
    const seen = new Set();

    return routes.filter(route => {
        const coordinates =
            route.geometry?.coordinates || [];

        const sampleStep =
            Math.max(1, Math.floor(coordinates.length / 12));

        const shapeKey =
            coordinates
                .filter((_, index) =>
                    index % sampleStep === 0 ||
                    index === coordinates.length - 1
                )
                .map(point =>
                    point.map(value => value.toFixed(3)).join(',')
                )
                .join(';');

        const key =
            [
                Math.round(route.distance / 50),
                shapeKey
            ].join('|');

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function routeShapeSimilarity(routeA, routeB) {
    const coordsA =
        routeA.geometry?.coordinates || [];

    const coordsB =
        routeB.geometry?.coordinates || [];

    if (!coordsA.length || !coordsB.length) {
        return 0;
    }

    const sampleStep =
        Math.max(1, Math.floor(coordsA.length / 16));

    const samples =
        coordsA.filter((_, index) =>
            index % sampleStep === 0 ||
            index === coordsA.length - 1
        );

    const closeMatches =
        samples.filter(pointA =>
            coordsB.some(pointB => {
                const lngDiff =
                    pointA[0] - pointB[0];

                const latDiff =
                    pointA[1] - pointB[1];

                return Math.sqrt(
                    (lngDiff * lngDiff) +
                        (latDiff * latDiff)
                ) < 0.0012;
            })
        ).length;

    return closeMatches / samples.length;
}

function isDistinctRoute(route, compareTo) {
    return routeShapeSimilarity(route, compareTo) < 0.78;
}

function classifyRoutesByEta(routes) {
    if (!routes.length) {
        return routes;
    }

    const fastestDuration =
        Math.min(
            ...routes.map(route =>
                getAdjustedRouteDuration(route)
            )
        );

    return routes.map(route => {
        const duration =
            getAdjustedRouteDuration(route);

        return {
            ...route,
            routeClass:
                duration === fastestDuration
                    ? 'fastest'
                    : 'standard',
            usesToll:
                route.usesToll ?? routeHasTollRoad(route)
        };
    });
}

function classifyRoutesWithStandardAlternative(routes) {
    const safeRoutes =
        filterRestrictedRoutes(dedupeRoutes(routes));

    if (!safeRoutes.length) {
        return safeRoutes;
    }

    const sortedByDuration =
        [...safeRoutes].sort((a, b) =>
            getAdjustedRouteDuration(a) -
                getAdjustedRouteDuration(b)
        );

    const fastest =
        sortedByDuration[0];

    const minStandardDistance =
        fastest.distance * 1.04;

    const maxStandardDistance =
        fastest.distance * 1.35;

    const standard =
        sortedByDuration.find(route =>
            route !== fastest &&
            isDistinctRoute(route, fastest) &&
            route.distance >= minStandardDistance &&
            route.distance <= maxStandardDistance
        ) ||
        sortedByDuration.find(route =>
            route !== fastest &&
            isDistinctRoute(route, fastest) &&
            route.distance <= maxStandardDistance
        );

    return sortedByDuration.map(route => ({
        ...route,
        routeClass:
            route === fastest
                ? 'fastest'
                : route === standard
                    ? 'standard'
                    : 'alternate',
        usesToll:
            route.usesToll ?? routeHasTollRoad(route)
    }));
}

function sortRoutesForDisplay(routes) {
    const sorted = [...routes].sort((a, b) => {
        if (a.routeClass !== b.routeClass) {
            const rank = {
                fastest: 0,
                standard: 1,
                alternate: 2
            };

            return (rank[a.routeClass] ?? 3) -
                (rank[b.routeClass] ?? 3);
        }

        return getAdjustedRouteDuration(a) -
            getAdjustedRouteDuration(b);
    });

    return sorted.filter((route, index) =>
        sorted.findIndex((candidate, candidateIndex) =>
            candidateIndex < index &&
            !isDistinctRoute(route, candidate)
        ) === -1
    );
}

function filterRestrictedRoutes(routes) {
    if (
        selectedVehicle === 'motorcycle' &&
        motorcycleCc === 'under400'
    ) {
        return routes.filter(route =>
            !routeHasTollRoad(route)
        );
    }

    if (
        selectedVehicle === 'bicycle' ||
        selectedVehicle === 'walking'
    ) {
        return routes.filter(route =>
            !routeHasTollRoad(route)
        );
    }

    return routes;
}

function formatDuration(seconds) {
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours < 24) {
        return minutes === 0
            ? `${hours}h`
            : `${hours}h ${minutes}m`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    const parts = [`${days}d`];
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(' ');
}

function formatKm(meters) {
    return `${(meters / 1000).toFixed(2)} km`;
}

function clearRouteLayers() {
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers.length = 0;
}

function getVehicleDurationMultiplier(vehicle) {
    switch (vehicle) {
        case 'car':
            return 0.9;
        case 'motorcycle':
            return 1.0;
        case 'bicycle':
            return 3.0;
        case 'walking':
            return 6.5;
        default:
            return 1.0;
    }
}

async function fetchRoutesOSRM(from, to, profile, exclusions = []) {
    const origin = `${from.lng},${from.lat}`;
    const destination = `${to.lng},${to.lat}`;

    const params =
        new URLSearchParams({
            alternatives: 'true',
            overview: 'full',
            geometries: 'geojson',
            steps: 'true'
        });

    if (exclusions.length > 0) {
        params.set(
            'exclude',
            exclusions.join(',')
        );
    }

    const url =
        `https://router.project-osrm.org/route/v1/${profile}/${origin};${destination}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message || 'Routing service error'
        );
    }

    const data = await response.json();
    return data.routes || [];
}

function decodeValhallaShape(shape) {
    const coordinates = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < shape.length) {
        let result = 0;
        let shift = 0;
        let byte = null;

        do {
            byte = shape.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const latDelta =
            (result & 1)
                ? ~(result >> 1)
                : (result >> 1);

        lat += latDelta;

        result = 0;
        shift = 0;

        do {
            byte = shape.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const lngDelta =
            (result & 1)
                ? ~(result >> 1)
                : (result >> 1);

        lng += lngDelta;

        coordinates.push([
            lng * 1e-6,
            lat * 1e-6
        ]);
    }

    return coordinates;
}

async function fetchRoutesValhalla(from, to, costing, costingOptions = {}, extraOptions = {}) {
    const request = {
        locations: [
            {
                lat: from.lat,
                lon: from.lng
            },
            {
                lat: to.lat,
                lon: to.lng
            }
        ],
        costing,
        costing_options: costingOptions,
        directions_options: {
            units: 'kilometers'
        },
        ...extraOptions
    };

    const url =
        `https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify(request))}`;

    const response =
        await fetch(url);

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message || 'Valhalla routing service error'
        );
    }

    const data =
        await response.json();

    if (data.trip?.status !== 0) {
        throw new Error(
            data.trip?.status_message ||
                'No route found'
        );
    }

    const trips =
        [
            data.trip,
            ...(data.alternates || []).map(alternate =>
                alternate.trip
            )
        ]
            .filter(Boolean);

    return trips.map(trip => {
        const coordinates =
            trip.legs.flatMap(leg =>
                decodeValhallaShape(leg.shape)
            );

        const maneuvers =
            trip.legs.flatMap(leg =>
                leg.maneuvers || []
            );

        return {
            distance:
                trip.summary.length * 1000,
            duration:
                trip.summary.time,
            geometry: {
                type: 'LineString',
                coordinates
            },
            legs: [
                {
                    steps:
                        maneuvers.map(maneuver => ({
                            name:
                                [
                                    ...(maneuver.street_names || []),
                                    ...(maneuver.begin_street_names || [])
                                ].join(' '),
                            ref:
                                maneuver.highway_sign?.text,
                            destinations:
                                maneuver.verbal_post_transition_instruction,
                            classes: []
                        }))
                }
            ]
        };
    });
}

async function fetchRoutesSafely(requests) {
    const routes = [];

    for (const request of requests) {
        try {
            const result =
                await request();

            routes.push(...result);
        }
        catch (error) {
            console.warn(
                'Route source failed, trying fallback.',
                error
            );
        }
    }

    return routes;
}

async function fetchServiceRoadFallbackRoutes(from, to) {
    currentRouteNote +=
        ' Long-distance fallback used service-road-preferred road geometry and removed configured pay-toll routes when detected.';

    const routes =
        await fetchRoutesSafely([
            () => fetchRoutesValhalla(
                from,
                to,
                'auto',
                {
                    auto: {
                        use_highways: 0,
                        use_tolls: 0
                    }
                },
                {
                    alternates: 1
                }
            ),
            () => fetchRoutesOSRM(
                from,
                to,
                'driving'
            )
        ]);

    return filterRestrictedRoutes(routes);
}

async function classifyWithFallback(routes, from, to) {
    const classifiedRoutes =
        classifyRoutesWithStandardAlternative(routes);

    if (classifiedRoutes.length > 0) {
        return classifiedRoutes;
    }

    const fallbackRoutes =
        await fetchServiceRoadFallbackRoutes(from, to);

    return classifyRoutesWithStandardAlternative(fallbackRoutes);
}

async function fetchRoutesForSelectedVehicle(from, to) {
    const profile =
        getProfileForVehicle(selectedVehicle);

    const exclusions =
        getRouteExclusions(selectedVehicle);

    currentDurationStrategy = 'osrm';
    currentRouteNote = getRoutingDescription();

    if (isTollEligibleVehicle()) {
        currentDurationStrategy = 'profileActual';

        currentRouteNote =
            selectedVehicle === 'car'
                ? 'Routes are compared by ETA. Configured pay-toll roads count as fastest only when they are actually quicker; EDSA is treated as a standard highway.'
                : '400cc+ motorcycle routes apply a lane-filtering ETA advantage, then compare routes by ETA. Configured pay-toll roads count as fastest only when they are actually quicker; EDSA is treated as a standard highway.';

        try {
            const [tollRoutes, standardRoutes] =
                await Promise.all([
                    fetchRoutesValhalla(
                        from,
                        to,
                        'auto',
                        {
                            auto: {
                                use_highways: 1,
                                use_tolls: 1
                            }
                        },
                        {
                            alternates: 1
                        }
                    ),
                    fetchRoutesValhalla(
                        from,
                        to,
                        'auto',
                        {
                            auto: {
                                use_highways: 0.2,
                                use_tolls: 0
                            }
                        },
                        {
                            alternates: 1
                        }
                    )
                ]);

            const taggedTollRoutes =
                tollRoutes.map(route => ({
                    ...route,
                    candidateType: 'toll',
                    usesToll: routeHasTollRoad(route)
                }));

            const taggedStandardRoutes =
                standardRoutes.map(route => ({
                    ...route,
                    candidateType: 'standard',
                    usesToll: false
                }));

            return classifyRoutesWithStandardAlternative(
                dedupeRoutes([
                    ...taggedTollRoutes,
                    ...taggedStandardRoutes
                ])
            );
        }
        catch (error) {
            console.warn(
                'ETA-compared auto routing is unavailable; using driving fallback.',
                error
            );

            currentDurationStrategy = 'osrm';
            currentRouteNote =
                'Route used driving fallback because ETA-compared auto routing is unavailable.';
        }
    }

    if (
        selectedVehicle === 'motorcycle' &&
        motorcycleCc === 'under400'
    ) {
        currentDurationStrategy = 'profileActual';
        currentRouteNote =
            'Under 400cc motorcycle route can use regular highways like EDSA, avoids configured pay-toll roads, and estimates time from distance.';

        const routes =
            await fetchRoutesSafely([
                () => fetchRoutesValhalla(
                    from,
                    to,
                    'motor_scooter',
                    {
                        motor_scooter: {
                            top_speed: 45,
                            use_primary: 0.85
                        }
                    },
                    {
                        alternates: 1
                    }
                ),
                () => fetchRoutesValhalla(
                    from,
                    to,
                    'motor_scooter',
                    {
                        motor_scooter: {
                            top_speed: 45,
                            use_primary: 0.35
                        }
                    },
                    {
                        alternates: 1
                    }
                )
            ]);

        return classifyWithFallback(
            routes,
            from,
            to
        );
    }

    if (selectedVehicle === 'bicycle') {
        currentDurationStrategy = 'profileActual';
        currentRouteNote =
            'Bicycle route can use regular highways where allowed, avoids configured pay-toll roads, and estimates time from distance.';

        const routes =
            await fetchRoutesSafely([
                () => fetchRoutesValhalla(
                    from,
                    to,
                    'bicycle',
                    {
                        bicycle: {
                            use_roads: 0.55,
                            bicycle_type: 'Hybrid'
                        }
                    },
                    {
                        alternates: 1
                    }
                ),
                () => fetchRoutesValhalla(
                    from,
                    to,
                    'bicycle',
                    {
                        bicycle: {
                            use_roads: 0.2,
                            bicycle_type: 'Hybrid'
                        }
                    },
                    {
                        alternates: 1
                    }
                ),
                () => fetchRoutesOSRM(
                    from,
                    to,
                    'bike'
                )
            ]);

        return classifyWithFallback(
            routes,
            from,
            to
        );
    }

    if (selectedVehicle === 'walking') {
        currentDurationStrategy = 'profileActual';
        currentRouteNote =
            'Walking route can use regular highways where pedestrian access is allowed, avoids configured pay-toll roads, and estimates time from distance.';

        const routes =
            await fetchRoutesSafely([
                () => fetchRoutesValhalla(
                    from,
                    to,
                    'pedestrian',
                    {},
                    {
                        alternates: 2
                    }
                ),
                () => fetchRoutesOSRM(
                    from,
                    to,
                    'foot'
                )
            ]);

        return classifyWithFallback(
            routes,
            from,
            to
        );
    }

    const routes = await fetchRoutesOSRM(
        from,
        to,
        profile,
        exclusions
    );

    return classifyRoutesByEta(
        filterRestrictedRoutes(routes)
    );
}

function drawRoutes(routes) {
    clearRouteLayers();
    if (!routes || routes.length === 0) return;

    const primaryRoute =
        routes[selectedRouteIndex] ||
        choosePrimaryRoute(routes);

    routes.forEach((route, index) => {
        const isBest = route === primaryRoute;
        const isFastest =
            route.routeClass === 'fastest';
        const isToll =
            route.usesToll === true;

        const style = {
            color:
                isBest
                    ? getRouteColor()
                    : isFastest
                        ? '#22c55e'
                        : isToll
                            ? '#f97316'
                            : '#60a5fa',
            weight: isBest ? 8 : 5,
            opacity: isBest ? 0.95 : 0.55
        };

        const routeLabel =
            isFastest
                ? 'Fastest ETA'
                : isToll
                    ? 'Toll alternate'
                    : 'Standard alternate';

        const layer = L.geoJSON(route.geometry, { style }).addTo(map);
        layer.bindPopup(`${routeLabel}<br>${formatKm(route.distance)} • ${formatDuration(getAdjustedRouteDuration(route))}`);
        routeLayers.push(layer);
    });

    const group = L.featureGroup(routeLayers);
    map.fitBounds(group.getBounds(), { padding: [60, 60] });
}

function updateRouteInfo(route) {
    if (!route) {
        document.getElementById('distanceText').textContent = '--';
        document.getElementById('timeText').textContent = '--';
        return;
    }

    document.getElementById('distanceText').textContent =
        formatKm(route.distance);

    document.getElementById('timeText').textContent =
        formatDuration(getAdjustedRouteDuration(route));

    showRouteNote(getPrimaryRouteNote(route));
}

function getDefaultRouteIndex(routes) {
    const primary =
        choosePrimaryRoute(routes);

    return Math.max(
        0,
        routes.indexOf(primary)
    );
}

function selectDisplayedRoute(index) {
    if (!currentRoutes.length) {
        return;
    }

    selectedRouteIndex =
        Math.max(
            0,
            Math.min(index, currentRoutes.length - 1)
        );

    drawRoutes(currentRoutes);
    updateRouteInfo(currentRoutes[selectedRouteIndex]);
    renderStandardAlternates();
}

function renderStandardAlternates() {
    standardAlternates.innerHTML = '';

    const standardRoutes =
        currentRoutes
            .map((route, index) => ({
                route,
                index
            }))
            .filter(item =>
                item.route.routeClass === 'standard' ||
                item.route.routeClass === 'alternate'
            );

    if (
        selectedRoute !== 'standard' ||
        standardRoutes.length === 0
    ) {
        standardAlternates.style.display = 'none';
        return;
    }

    standardRoutes.forEach((item, buttonIndex) => {
        const button =
            document.createElement('button');

        button.type = 'button';
        button.className = 'standard-alt-btn';
        button.classList.toggle(
            'active',
            item.index === selectedRouteIndex
        );

        button.innerHTML =
            `Standard ${buttonIndex + 1}` +
            `<span>${formatKm(item.route.distance)} • ${formatDuration(getAdjustedRouteDuration(item.route))}</span>`;

        button.addEventListener(
            'click',
            () => selectDisplayedRoute(item.index)
        );

        standardAlternates.appendChild(button);
    });

    standardAlternates.style.display = 'flex';
}

function choosePrimaryRoute(routes) {
    if (selectedRoute === 'fastest') {
        return routes.reduce((a, b) =>
            getAdjustedRouteDuration(a) < getAdjustedRouteDuration(b)
                ? a
                : b
        );
    }

    const standardRoutes =
        routes.filter(route =>
            route.routeClass === 'standard'
        );

    const candidates =
        standardRoutes.length > 0
            ? standardRoutes
            : routes;

    return candidates.reduce((a, b) =>
        getAdjustedRouteDuration(a) < getAdjustedRouteDuration(b)
            ? a
            : b
    );
}

function showAlert(message) {
    alert(message);
}

function showRouteNote(message) {
    const messageBox =
        document.getElementById('messageBox');

    if (!message) {
        messageBox.style.display = 'none';
        messageBox.textContent = '';
        return;
    }

    messageBox.textContent = message;
    messageBox.style.display = 'block';
}

function getPrimaryRouteNote(primaryRoute) {
    if (!isTollEligibleVehicle()) {
        const selectedKind =
            primaryRoute.routeClass === 'standard'
                ? 'Standard alternate'
                : 'Fastest';

        const fallbackNote =
            selectedRoute === 'standard' &&
            primaryRoute.routeClass !== 'standard'
                ? ' No distinct standard alternate was available for this origin and destination.'
                : '';

        return `${currentRouteNote} ${selectedKind} route selected by ETA and distance limits.${fallbackNote}`;
    }

    const routeKind =
        primaryRoute.usesToll
            ? 'configured pay-toll'
            : 'standard highway';

    const selectedKind =
        primaryRoute.routeClass === 'standard'
            ? 'Standard'
            : 'Fastest';

    const fallbackNote =
        selectedRoute === 'standard' &&
        primaryRoute.routeClass !== 'standard'
            ? ' No distinct standard alternate was available for this origin and destination.'
            : '';

    return `${currentRouteNote} ${selectedKind} selection is using a ${routeKind} route based on ETA.${fallbackNote}`;
}

// =====================================
// FIND ROUTE
// =====================================

document
    .getElementById('findRouteBtn')
    .addEventListener('click',
        async () => {
            if (!fromLocation || !toLocation) {
                showAlert('Please select a starting point and destination from the map or suggestions.');
                return;
            }

            if (startMarker) map.removeLayer(startMarker);
            if (endMarker) map.removeLayer(endMarker);
            clearRouteLayers();

            startMarker = L.marker([fromLocation.lat, fromLocation.lng], { icon: startIcon })
                .addTo(map)
                .bindPopup('Starting Point');

            endMarker = L.marker([toLocation.lat, toLocation.lng], { icon: destinationIcon })
                .addTo(map)
                .bindPopup('Destination');

            try {
                const routes = await fetchRoutesForSelectedVehicle(
                    fromLocation,
                    toLocation
                );

                if (!routes.length) {
                    showAlert('No route found between the selected locations.');
                    return;
                }

                currentRoutes =
                    sortRoutesForDisplay(routes)
                        .slice(0, 4);
                selectedRouteIndex =
                    getDefaultRouteIndex(currentRoutes);

                drawRoutes(currentRoutes);
                updateRouteInfo(currentRoutes[selectedRouteIndex]);
                renderStandardAlternates();
                setMapPickingEnabled(false);
            }
            catch (error) {
                console.error(error);
                showAlert('Unable to calculate route with the selected vehicle rules. Please try another route or vehicle option.');
            }
        }
    );

// =====================================
// RESET
// =====================================

document
    .getElementById(
        'deselectRouteBtn'
    )
    .addEventListener(
        'click',
        () => {

            resetRouteState();
            showRouteNote('');
            setMapPickingEnabled(false);

            document.getElementById(
                'distanceText'
            ).textContent = '--';

            document.getElementById(
                'timeText'
            ).textContent = '--';

        }
    );

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

            resetRouteState();
            resetMapPicker();
            showRouteNote('');

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
