const map = L.map('map').setView([14.58,121.13],13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OpenStreetMap'
}).addTo(map);

// STATE
let origin=null;
let destination=null;

let originMarker=null;
let destinationMarker=null;

let routeLine=null;

// ======================
// SEARCH (FIXED STABLE)
// ======================
async function search(q){
if(!q || q.length < 2) return [];

const res = await fetch(
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ", Philippines")}&limit=5`
);

return await res.json();
}

// ======================
// SHOW RESULTS (FIXED DOM)
// ======================
function showResults(data, boxId, type){

const box = document.getElementById(boxId);
box.innerHTML = "";

data.forEach(item=>{

const div = document.createElement("div");
div.className = "result";
div.innerText = item.display_name;

div.onclick = ()=>select(item,type);

box.appendChild(div);

});

}

// ======================
// SELECT LOCATION (FIXED)
// ======================
function select(item,type){

const lat = parseFloat(item.lat);
const lon = parseFloat(item.lon);

map.setView([lat,lon],15);

if(type === "origin"){

origin = {lat,lon};

if(originMarker){
map.removeLayer(originMarker);
}

originMarker = L.marker([lat,lon])
.addTo(map)
.bindPopup("Start")
.openPopup();

}

if(type === "destination"){

destination = {lat,lon};

if(destinationMarker){
map.removeLayer(destinationMarker);
}

destinationMarker = L.marker([lat,lon])
.addTo(map)
.bindPopup("Destination")
.openPopup();

}

if(origin && destination){
drawRoute();
}

}

// ======================
// REAL ROUTE LINE
// ======================
function drawRoute(){

if(routeLine){
map.removeLayer(routeLine);
}

routeLine = L.polyline(
[
[origin.lat,origin.lon],
[destination.lat,destination.lon]
],
{
color:"#00a884",
weight:5
}
).addTo(map);

map.fitBounds(routeLine.getBounds(),{
padding:[40,40]
});

}

// ======================
// INPUT EVENTS (FIXED)
// ======================
document.getElementById("originInput").addEventListener("input",async function(){
const data = await search(this.value);
showResults(data,"originResults","origin");
});

document.getElementById("destinationInput").addEventListener("input",async function(){
const data = await search(this.value);
showResults(data,"destinationResults","destination");
});

// ======================
// RESET
// ======================
document.getElementById("reset").onclick = ()=>{
location.reload();
};
