function findDonor() {

    let bloodGroup =
        document.getElementById("bloodGroup").value;

    let location =
        document.getElementById("location").value;

    let result =
        document.getElementById("result");


    if (bloodGroup === "" || location === "") {

        result.innerHTML =
            "<p>Please select blood group and enter location.</p>";

        return;
    }


    result.innerHTML = `
        <div class="donor-card">

            <h3>Nearby Donor Found 🩸</h3>

            <p><strong>Blood Group:</strong>
            ${bloodGroup}</p>

            <p><strong>Location:</strong>
            ${location}</p>

            <p><strong>Status:</strong>
            Available</p>

            <p><strong>Distance:</strong>
            2.5 km</p>

            <button>Contact Donor</button>

        </div>
    `;
}