const ORS_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjhlNDk3NjY2ZmEyNTRkZjQ5ODI4ZDAxNGRhZTk0YTNkIiwiaCI6Im11cm11cjY0In0=";

// MAP
const map = L.map('map').setView([14.58,121.13],13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OSM'
}).addTo(map);

// STATE
let origin=null,destination=null,pickup=null;
let originMarker=null,destinationMarker=null,pickupMarkers=[];
let routeLayer=null;
let routes=[];

// ICONS
const startIcon=L.icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/684/684908.png',
iconSize:[35,35]
});

const endIcon=L.icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
iconSize:[35,35]
});

// GEO SEARCH (REAL + PHILIPPINES)
async function search(q){
if(q.length<2) return [];

const res=await fetch(
`https://api.openrouteservice.org/geocode/search?api_key=${ORS_KEY}&text=${encodeURIComponent(q)}, Philippines&size=5`
);

const data=await res.json();
return data.features || [];
}

// SHOW RESULTS
function showResults(data,containerId,type){
const container=document.getElementById(containerId);
container.innerHTML="";

data.forEach(item=>{

const name=item.properties.label;

const div=document.createElement("div");
div.className="result";
div.innerText=name;

div.onclick=()=>select(item,type);

container.appendChild(div);

});
}

// SELECT LOCATION
function select(item,type){

const [lon,lat]=item.geometry.coordinates;

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

if(origin&&destination){
getRoutes();
drawRoute(0);
}

}

// PICKUP POINTS
function generatePickup(lat,lon){

pickupMarkers.forEach(m=>map.removeLayer(m));
pickupMarkers=[];

const opts=[
{name:"Main Entrance",lat:lat+0.0005,lon},
{name:"Roadside",lat,lon:lon+0.0005},
{name:"Terminal",lat:lat-0.0005,lon:lon-0.0005}
];

const box=document.getElementById("pickupOptions");
box.innerHTML="";

opts.forEach(o=>{

const m=L.marker([o.lat,o.lon]).addTo(map).bindPopup(o.name);
pickupMarkers.push(m);

const div=document.createElement("div");
div.className="pickup";
div.innerText=o.name;

div.onclick=()=>{
pickup=o;

if(originMarker) map.removeLayer(originMarker);

originMarker=L.marker([o.lat,o.lon],{icon:startIcon})
.addTo(map)
.bindPopup(o.name);

getRoutes();
drawRoute(0);
};

box.appendChild(div);

});

}

// REAL ROUTES (OSRM via OpenRouteService)
async function getRoutes(){

const start = pickup || origin;

const body = {
coordinates:[
[start.lon,start.lat],
[destination.lon,destination.lat]
]
};

const res=await fetch(
"https://api.openrouteservice.org/v2/directions/driving-car/geojson",
{
method:"POST",
headers:{
"Authorization":ORS_KEY,
"Content-Type":"application/json"
},
body:JSON.stringify(body)
}
);

const data=await res.json();

// simulate 3 alternatives
routes=[
data.features[0].geometry.coordinates.map(c=>[c[1],c[0]]),
data.features[0].geometry.coordinates.map(c=>[c[1],c[0]]).reverse(),
data.features[0].geometry.coordinates.map(c=>[c[1],c[0]]).map(p=>[p[0]+0.001,p[1]])
];

}

// DRAW ROUTE
function drawRoute(i){

if(!routes.length) return;

if(routeLayer) map.removeLayer(routeLayer);

const colors=["#00a884","#2196f3","#ff9800"];

routeLayer=L.polyline(routes[i],{
color:colors[i],
weight:6
}).addTo(map);

map.fitBounds(routeLayer.getBounds(),{padding:[30,30]});

}

// INPUTS
document.getElementById("originInput")
.addEventListener("input",async function(){
const data=await search(this.value);
showResults(data,"originResults","origin");
});

document.getElementById("destinationInput")
.addEventListener("input",async function(){
const data=await search(this.value);
showResults(data,"destinationResults","destination");
});

// ROUTES SWITCH
document.querySelectorAll(".route-card")
.forEach((c,i)=>{
c.onclick=()=>drawRoute(i);
});

// RESET
document.getElementById("resetBtn")
.onclick=()=>location.reload();
