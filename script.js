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
