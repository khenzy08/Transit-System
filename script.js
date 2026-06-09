const map = L.map('map').setView([14.58,121.13], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OpenStreetMap'
}).addTo(map);

// STATE
let origin = null;
let destination = null;
let pickup = null;

let originMarker = null;
let destinationMarker = null;
let pickupMarkers = [];
let routeLayer = null;

let routes = [];

// ICONS
const startIcon = L.icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/684/684908.png',
iconSize:[35,35]
});

const endIcon = L.icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
iconSize:[35,35]
});

// FIXED SEARCH (Philippines-focused but stable)
async function search(q){

if(q.length < 2) return [];

const res = await fetch(
`https://nominatim.openstreetmap.org/search?` +
`format=json&limit=5&q=${encodeURIComponent(q)}`
);

return await res.json();
}

// SHOW RESULTS (FIXED DOM ACCESS)
function showResults(data, containerId, type){

const container = document.getElementById(containerId);

container.innerHTML = '';

data.forEach(item=>{

const div = document.createElement('div');
div.className = 'result-item';
div.innerText = item.display_name;

div.onclick = ()=>selectLocation(item,type);

container.appendChild(div);

});

}

// SELECT LOCATION
function selectLocation(item,type){

const lat = parseFloat(item.lat);
const lon = parseFloat(item.lon);

map.setView([lat,lon],15);

if(type === 'origin'){
origin = {lat,lon};
generatePickup(lat,lon);
}

if(type === 'destination'){
destination = {lat,lon};

if(destinationMarker){
map.removeLayer(destinationMarker);
}

destinationMarker = L.marker([lat,lon],{icon:endIcon})
.addTo(map)
.bindPopup("Destination");
}

if(origin && destination){
createRoutes();
drawRoute(0);
}

}

// PICKUP OPTIONS
function generatePickup(lat,lon){

pickupMarkers.forEach(m=>map.removeLayer(m));
pickupMarkers = [];

pickup = null;

const options = [
{ name:"Main Entrance", lat:lat+0.0005, lon },
{ name:"Roadside Pickup", lat, lon:lon+0.0005 },
{ name:"Terminal", lat:lat-0.0005, lon:lon-0.0005 }
];

const box = document.getElementById("pickupOptions");
box.innerHTML = '';

options.forEach(opt=>{

const marker = L.marker([opt.lat,opt.lon])
.addTo(map)
.bindPopup(opt.name);

pickupMarkers.push(marker);

const div = document.createElement("div");
div.className = "pickup";
div.innerText = opt.name;

div.onclick = ()=>{

pickup = opt;

if(originMarker){
map.removeLayer(originMarker);
}

originMarker = L.marker([opt.lat,opt.lon],{icon:startIcon})
.addTo(map)
.bindPopup(opt.name);

createRoutes();
drawRoute(0);

};

box.appendChild(div);

});

}

// ROUTES
function createRoutes(){

const start = pickup || origin;

const midLat = (start.lat + destination.lat)/2;
const midLon = (start.lon + destination.lon)/2;

routes = [

[
[start.lat,start.lon],
[midLat+0.01,midLon],
[destination.lat,destination.lon]
],

[
[start.lat,start.lon],
[midLat,midLon+0.01],
[destination.lat,destination.lon]
],

[
[start.lat,start.lon],
[midLat-0.01,midLon-0.01],
[destination.lat,destination.lon]
]

];

}

// DRAW ROUTE (FIXED SAFE CHECK)
function drawRoute(i){

if(!routes.length) return;

if(routeLayer){
map.removeLayer(routeLayer);
}

const colors = ["#00a884","#2196f3","#ff9800"];

routeLayer = L.polyline(routes[i],{
color:colors[i],
weight:5
}).addTo(map);

map.fitBounds(routeLayer.getBounds(),{
padding:[40,40]
});

}

// INPUT EVENTS (FIXED IDS)
document.getElementById("originInput")
.addEventListener("input",async function(){

const data = await search(this.value);

showResults(
data,
"originResults",
"origin"
);

});

document.getElementById("destinationInput")
.addEventListener("input",async function(){

const data = await search(this.value);

showResults(
data,
"destinationResults",
"destination"
);

});

// ROUTE SWITCH
document.querySelectorAll(".route-card")
.forEach((c,i)=>{

c.onclick = ()=>drawRoute(i);

});

// RESET
document.getElementById("resetBtn")
.onclick = ()=>location.reload();
