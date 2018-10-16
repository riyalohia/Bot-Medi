$(document).ready(function() {
    $('#submit').on('click', showTreatments);
});

function showTreatments(event) {
    // Send parameters like symptom and age to app.js via post request. 
    event.preventDefault();

    var errorCount = 0;
    $('.group input').each(function(index, val) {
        if ($(this).val() === '') { errorCount++; }
    });

    if (errorCount === 0) {
        document.getElementById('load').innerHTML = '<div class="loader"></div>';
        document.getElementById('timeline1').innerHTML = '';
        var symptom = {
            'symptom': document.getElementById('symptom').value,
            'age': 2018 - document.getElementById('age').value
        }

        $.when($.ajax({
            type: 'POST',
            data: symptom,
            url: '/symptoms',
            dataType: 'JSON'
        })).then(function(message) {
            populateDiv();
        });


    } else {
        // If any of the fields is empty.
        alert('Please fill in all fields');
        return false;
    }
};

function populateDiv() {
    // Fetch database containing diseases and treatments from app.js via get request.
    // DOM is manipulated after fetching data
    document.getElementById('load').innerHTML = '';
    var divContent = '';
    var count = 0;
    var headerString = '<center><div class="columns large-10 indata-btn"><div><h1 class="text-center"><b>Treatments</b></h1></div></div></center>'
    var timelineString = '<div class="row"><div id="timeline"></div></div>';
    var sectionString = headerString + timelineString;

    $.getJSON('/treatments', function(data) {
        data.forEach(function(i) {
            if (i.Treatment !== undefined) {
                count++;
                divContent += '<div class="timeline-item" id="timeline-item' + i._id + '">';
                if (count % 2 !== 0) {
                    divContent += '<div class="timeline-content right">';
                } else {
                    divContent += '<div class="timeline-content left">';
                }
                divContent += '<center><h2>' + i.Name + '</h2></center>';
                divContent += '<br><ul>';
                for (var j = 0; j < i.Treatment.length; j++) {
                    if (j !== i.Treatment.length - 1) {
                        divContent += "<li class='accordion'>" + i.Treatment[j + 1] + "</li>";
                    }
                }
                divContent += '</ul>';
                divContent += '<div id="nearbyHospitals' + i._id + '">';
                divContent += '<center><button class="hospitals" id=' + i._id + '>Nearby Hospitals</button></center>';
                divContent += '</div>';
                divContent += '</div>';
                divContent += '</div>';
            }

        });

        document.getElementById('timeline1').innerHTML = sectionString;
        document.getElementById('timeline').innerHTML = divContent;


        var hospitalButtons = document.querySelectorAll(".hospitals");
        for (j = 0; j < hospitalButtons.length; j++) {
            hospitalButtons[j].onclick = function(event) { getHospitals(event.target.id) };
        }

    });
}

function getHospitals(id) {
    // Fetch nearby hospital for a particular disease.
    function getLocation(callback) {
        if (navigator.geolocation) {
            var lat_lng = navigator.geolocation.getCurrentPosition(function(position) {
                var user_position = {};
                user_position.lat = position.coords.latitude;
                user_position.lng = position.coords.longitude;
                callback(user_position);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }
    var id = {
        '_id': id
    }
    getLocation(function(lat_lng) {
        $.when($.ajax({
            type: 'POST',
            data: { 'ID': id, 'coords': lat_lng },
            url: '/doctors',
            dataType: 'JSON'
        })).then(function(hospitals) {
            displayHospitals(hospitals, lat_lng, id._id);
        });
    });
}

function displayHospitals(hospitals, coords, id) {
    document.getElementById("nearbyHospitals" + id).innerHTML = "";
    if (hospitals.hospitals.length == 0) {
        alert("No Hospitals Nearby");
    } else {
        var content = '<center><div class="doctors">Nearby Hospitals</div></center>';
        for (var i = 0; i < hospitals.hospitals.length; i++) {
            content += '<a href ="https://www.google.com/maps/dir/?api=1&origin=' + coords.lat + ',' + coords.lng + '&destination=' + hospitals.hospitals[i].geometry.location.lat + ',' + hospitals.hospitals[i].geometry.location.lng + '" target="_blank"><ul><li class="accordion">';
            content += hospitals.hospitals[i].name;
            content += '</li></a></ul>';
        }
        document.getElementById("nearbyHospitals" + id).innerHTML = content;
    }
}