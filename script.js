const map = L.map('map').setView(
    [14.5764,121.1329],
    13
);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    attribution:'© OpenStreetMap'
}
).addTo(map);

const startIcon = L.icon({
    iconUrl:
'https://cdn-icons-png.flaticon.com/512/684/684908.png',

    iconSize:[40,40],
    iconAnchor:[20,40]
});

const destinationIcon = L.icon({
    iconUrl:
'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',

    iconSize:[40,40],
    iconAnchor:[20,40]
});

let originData = null;
let destinationData = null;

let originMarker = null;
let destinationMarker = null;

let currentRoute = null;
let routes = [];

async function searchAddress(query){

    if(query.length < 3){
        return [];
    }

    const response =
    await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
    );

    return await response.json();
}

function createSuggestions(
    results,
    container,
    type
){

    container.innerHTML = '';

    results.forEach(location=>{

        const div =
        document.createElement('div');

        div.className =
        'result-item';

        div.textContent =
        location.display_name;

        div.onclick = ()=>{

            selectLocation(
                location,
                type
            );

            container.innerHTML = '';
        };

        container.appendChild(div);
    });
}

function selectLocation(
    location,
    type
){

    const lat =
    parseFloat(location.lat);

    const lon =
    parseFloat(location.lon);

    if(type === 'origin'){

        originData =
        {lat,lon};

        if(originMarker){
            map.removeLayer(originMarker);
        }

        originMarker =
        L.marker(
            [lat,lon],
            {icon:startIcon}
        )
        .addTo(map)
        .bindPopup("Start");

    }else{

        destinationData =
        {lat,lon};

        if(destinationMarker){
            map.removeLayer(destinationMarker);
        }

        destinationMarker =
        L.marker(
            [lat,lon],
            {icon:destinationIcon}
        )
        .addTo(map)
        .bindPopup("Destination");

    }

    map.setView(
        [lat,lon],
        15
    );

    if(
        originData &&
        destinationData
    ){
        generateRoutes();
        drawRoute(0);
    }
}

function generateRoutes(){

    const midLat =
    (originData.lat +
    destinationData.lat)/2;

    const midLon =
    (originData.lon +
    destinationData.lon)/2;

    routes = [

        [
            [originData.lat,
             originData.lon],

            [midLat+0.01,
             midLon],

            [destinationData.lat,
             destinationData.lon]
        ],

        [
            [originData.lat,
             originData.lon],

            [midLat,
             midLon+0.02],

            [destinationData.lat,
             destinationData.lon]
        ],

        [
            [originData.lat,
             originData.lon],

            [midLat-0.01,
             midLon-0.02],

            [destinationData.lat,
             destinationData.lon]
        ]

    ];
}

function drawRoute(index){

    if(currentRoute){
        map.removeLayer(
            currentRoute
        );
    }

    const colors = [
        "#00a884",
        "#2196f3",
        "#f39c12"
    ];

    currentRoute =
    L.polyline(
        routes[index],
        {
            color:colors[index],
            weight:6
        }
    ).addTo(map);

    map.fitBounds(
        currentRoute.getBounds()
    );
}

document
.getElementById(
'originInput'
)
.addEventListener(
'input',
async function(){

    const results =
    await searchAddress(
        this.value
    );

    createSuggestions(
        results,
        document.getElementById(
            'originResults'
        ),
        'origin'
    );
});

document
.getElementById(
'destinationInput'
)
.addEventListener(
'input',
async function(){

    const results =
    await searchAddress(
        this.value
    );

    createSuggestions(
        results,
        document.getElementById(
            'destinationResults'
        ),
        'destination'
    );
});

document
.querySelectorAll(
'.route-card'
)
.forEach(card=>{

    card.addEventListener(
    'click',
    ()=>{

        document
        .querySelectorAll(
        '.route-card'
        )
        .forEach(c=>
            c.classList.remove(
                'active'
            )
        );

        card.classList.add(
            'active'
        );

        drawRoute(
            parseInt(
                card.dataset.route
            )
        );
    });

});

document
.getElementById(
'clearBtn'
)
.addEventListener(
'click',
()=>{

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

    if(currentRoute){
        map.removeLayer(
            currentRoute
        );
    }

    originData = null;
    destinationData = null;

    document.getElementById(
    'originInput'
    ).value = '';

    document.getElementById(
    'destinationInput'
    ).value = '';

});
