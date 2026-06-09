const map = L.map('map').setView([14.58,121.13],13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OSM'
}).addTo(map);

// STATE
let origin=null;
let destination=null;
let pickup=null;

let originMarker=null;
let destinationMarker=null;
let pickupMarkers=[];
let routeLine=null;
let routes=[];

// ICONS
const startIcon = L.icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/684/684908.png',
iconSize:[35,35]
});

const endIcon = L.icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
iconSize:[35,35]
});

// ========================
// GEO SEARCH (FIXED)
// ========================
async function search(q){
if(q.length<2) return [];

const res = await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ", Philippines")}&limit=5`
);

return await res.json();
}

// ========================
// SHOW RESULTS
// ========================
function showResults(data,boxId,type){
const box=document.getElementById(boxId);
box.innerHTML="";

data.forEach(item=>{

const div=document.createElement("div");
div.className="result";
div.innerText=item.display_name;

div.onclick=()=>{
selectLocation(item,type);
box.innerHTML="";
};

box.appendChild(div);

});
}

// ========================
// SELECT LOCATION
// ========================
function selectLocation(item,type){

const lat=parseFloat(item.lat);
const lon=parseFloat(item.lon);

map.setView([lat,lon],15);

if(type==="origin"){

origin={lat,lon};
generatePickup(lat,lon);

}

if(type==="destination"){

destination={lat,lon};

if(destinationMarker) map.removeLayer(destinationMarker);

destinationMarker=L.marker([lat,lon],{icon:endIcon})
.addTo(map)
.bindPopup("Destination");

}

if(origin && destination){
getRoute();
drawRoute();
}

}

// ========================
// PICKUP POINTS (ANGKAS STYLE)
// ========================
function generatePickup(lat,lon){

pickupMarkers.forEach(m=>map.removeLayer(m));
pickupMarkers=[];

pickup=null;

const options=[
{name:"Main Entrance",lat:lat+0.0005,lon},
{name:"Roadside Pickup",lat,lon:lon+0.0005},
{name:"Terminal",lat:lat-0.0005,lon:lon-0.0005}
];

const box=document.getElementById("pickupBox");
box.innerHTML="";

options.forEach(o=>{

const marker=L.marker([o.lat,o.lon])
.addTo(map)
.bindPopup(o.name);

pickupMarkers.push(marker);

const div=document.createElement("div");
div.className="pickup";
div.innerText=o.name;

div.onclick=()=>{

pickup=o;

if(originMarker) map.removeLayer(originMarker);

originMarker=L.marker([o.lat,o.lon],{icon:startIcon})
.addTo(map)
.bindPopup(o.name);

getRoute();
drawRoute();

};

box.appendChild(div);

});

}

// ========================
// REAL ROUTING (OSRM)
// ========================
async function getRoute(){

const start = pickup || origin;

const url =
`https://router.project-osrm.org/route/v1/driving/`+
`${start.lon},${start.lat};${destination.lon},${destination.lat}`+
`?overview=full&geometries=geojson`;

const res = await fetch(url);
const data = await res.json();

const coords = data.routes[0].geometry.coordinates;

routes = [

coords.map(c=>[c[1],c[0]]),
coords.map(c=>[c[1],c[0]]).reverse(),
coords.map(c=>[c[1],c[0]]).map(p=>[p[0]+0.001,p[1]])
];

}

// ========================
// DRAW ROUTE
// ========================
function drawRoute(i=0){

if(routeLine) map.removeLayer(routeLine);

const colors=["#00a884","#2196f3","#ff9800"];

routeLine=L.polyline(routes[i],{
color:colors[i],
weight:6
}).addTo(map);

map.fitBounds(routeLine.getBounds(),{padding:[30,30]});

}

// ========================
// INPUT EVENTS
// ========================
document.getElementById("originInput").oninput=async function(){
const data=await search(this.value);
showResults(data,"originResults","origin");
};

document.getElementById("destinationInput").oninput=async function(){
const data=await search(this.value);
showResults(data,"destinationResults","destination");
};

// ========================
// ROUTE SWITCH
// ========================
document.querySelectorAll(".route-card").forEach((c,i)=>{
c.onclick=()=>{
document.querySelectorAll(".route-card")
.forEach(x=>x.classList.remove("active"));
c.classList.add("active");
drawRoute(i);
};
});

// ========================
// RESET
// ========================
document.getElementById("reset").onclick=()=>{
location.reload();
};
