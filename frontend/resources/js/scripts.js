/**
 * Web application
 */
// if copying over a full URL, make sure it does NOT end on a /
const apiUrl = 'https://websitebackend.12ly2k35msg2.eu-de.codeengine.appdomain.cloud/seforall';
// const apiUrl = 'http://localhost:8080/seforall';

var environment = "prod";
if (location.hostname) {
    switch(location.hostname.substring(0,3)) {
        case "dev":
            environment = "dev";
            break;
        case "tes":
            environment = "test";
            break;
        case "loc":
            environment = "dev";
            break;
      } 
} else {
    //localhost
    environment = "dev";
}
console.log(environment);

var polygonCoordinates = [];
var latLngs = [];
var overlayLayers = [];
var overlayInternetLayers = [];
var setMapView;
var showBuildings;
let country;
let countryCandidates = [];
let place = "";
let flag = false;
let urlGeoJSON = "https://counties-geojsons.s3.eu-de.cloud-object-storage.appdomain.cloud/";
let beginSurvey = {};
let beginFeedback = {};
let beginEval = {};
let map;
let tooltip;
let activePopupTab = 'param1';
function checkVisited() {
    const visitedCookie = document.cookie.split('; ').find(row => row.startsWith('visited='));
    if (visitedCookie) {
        // deleteCookie('selectedImageSrc');
        // deleteCookie('selectedText');
    } else {
        expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        document.cookie = "visited=true; expires=" + expiry.toGMTString();
    }
}

function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
}
// checkVisited()
// deleteCookie('selectedImageSrc');
// deleteCookie('selectedText');
// deleteCookie('survey');
// deleteCookie('visits');
// deleteCookie('indexVisited');
const citiesDropDown = document.getElementById("citiesDropDown");
const countryInput = document.getElementById("countryInput");
//function to start counting buildings from database
const countOfBuildingsRequst = {
    add(south, west, north, east, polygon_coordinates, place, country_name) {
        const coordinates = polygon_coordinates[0].map(point => [point.lng, point.lat]);
        coordinates.push(coordinates[0]);
        $.ajax({
            type: 'POST',
            url: `${apiUrl}/countOfBuildings`,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({
                south, west, north, east, polygon_coordinates, place, country_name
            }),
            dataType: 'json',
            beforeSend: function () {
                Swal.fire({
                    html: '<div><img src="resources/images/loading.gif" alt="Loading"/></div>',
                    title: 'We are processing your request....',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });
            },
            // Increase the timeout to allow for longer processing time
            timeout: 900_000, // Set to 60 seconds (adjust as needed)
        }).done(function (result) {
            Swal.fire(result.count + ' buildings', 'So many buildings were processed. ' + result.msg, 'success').then(function () {
                showBuildings(result.entry, result.geoJSON, "", coordinates)
            });
        }).fail(function () {
            Swal.fire('Request Failed', 'The request took too long to process.', 'error').then(function () {
            });
        });
    }
};

const resultMulti = {
    count: 0
    , msg: ""
    , entry: []
    , geoJSON: []
    , coordinates: []
}

const countOfMultiBuildingsRequest = {
    add(south, west, north, east, polygon_coordinates, place, country_name) {
        return new Promise(resolve => {
            const coordinates = polygon_coordinates[0].map(point => [point.lng, point.lat]);
            coordinates.push(coordinates[0]);
            $.ajax({
                type: 'POST',
                url: `${apiUrl}/countOfBuildings`,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify({
                    south, west, north, east, polygon_coordinates, place, country_name
                }),
                dataType: 'json',
                // Increase the timeout to allow for longer processing time
                timeout: 900_000, // Set to 60 seconds (adjust as needed)
            }).done(function (result) {
                resultMulti.count += result.count;
                // resultMulti.msg = result.msg;
                resultMulti.entry.push(result.entry);
                resultMulti.geoJSON.push(result.geoJSON);
                resultMulti.coordinates.push(coordinates);
                resolve();
            }).fail(function () {
                Swal.fire('Request Failed', 'The request took too long to process.', 'error').then(function () {
                });
            });
        })  
    }
};

function getCookie(name) {
    let cookieArray = document.cookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        let cookiePair = cookieArray[i].split('=');
        if (name === cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return null;
}

function getCookieVisits(name) {
    let cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(name + '=') == 0) {
            return cookie.substring(name.length + 1);
        }
    }
    return "";
}

function setCookie(name, value, days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    let expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function checkVisits() {
    let visits = getCookieVisits("visits");
    if (visits != "") {
        visits = parseInt(visits) + 1;
    } else {
        visits = 1;
    }
    setCookie("visits", visits, 365);

    if (visits === 7) {
        helpUs();
    }
}

function resetVisits() {
    setCookie("visits", 0, 365);
}

window.onload = checkVisits;
function helpUs() {
    Swal.fire({
        html: `
            <h3 style="margin: 0; color: #183F37; font-weight: 700; font-size: 40px; line-height: 45px; padding-top: 30px">HELP US IMPROVE!</h3>
            <p style="color: #183F37; font-size: 16px; font-weight: 400; line-height: 25px; padding-top: 30px; padding-bottom: 15px; text-align: center;padding-left: 35px;padding-right: 35px">We're eager to learn how we can best support your work. Could you take a quick 1-2 minute survey to share your thoughts on the Open Building Insights tool?</p>
            <button type="submit" class="btn" id="surveyBtn" style="margin-bottom: 30px;margin-left: 5px;padding:0; background-color: #183F37;height: 40px;width: 182px;color: #F8F3E9;font-weight: 600;line-height: 28px;font-size: 16px">Yes, happy to help</button>
        `,
        width: '495px',
        background: '#F8F3E9',
        backdrop: `
                    rgba(51, 57, 55, 0.898)
                `,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCloseButton: true,
        closeButtonHtml: `<small style="font-size: 12px; font-family: 'Mulish', sans-serif; font-weight: 600;">Postpone</small>`,
        closeButtonAriaLabel: "postpone",
        didOpen: () => {
            document.getElementById('surveyBtn').addEventListener('click', function() {
                window.location.href = 'survey.html';
            });
        },
        didClose: () => {
            resetVisits();
        }
    });
}
var indiaBoundaries1;
var indiaBoundaries2;

//function which is adding correct India Boundaries
function addIndiaBoundaries() {
    fetch('resources/assets/india_districts_new.json')
        .then(response => response.json())
        .then(data => {
            indiaBoundaries1 = L.geoJSON(data, {
                style: function (feature) {
                    let zoom = map.getZoom();
                    let opacity;
                    if (zoom < 10) {
                        opacity = 0.4;
                    } else {
                        opacity = 0.7
                    }
                    return boundaryStyle(feature, "#444", opacity, Math.max(1, 1));
                }
            }).addTo(map);

            indiaBoundaries2 = L.geoJSON(data, {
                style: function (feature) {
                    var zoom = map.getZoom();
                    var weight;
                    var opacity;
                    var color;
                    if (zoom < 10) {
                        weight = zoom * 0.6;
                        opacity = 0.3;
                        color = "#c9bf9b"
                    } else {
                        weight = zoom * 1.1;
                        opacity = 0.6
                        color = "#afa896"
                    }

                    return boundaryStyle(feature, color, opacity, weight);
                }
            }).addTo(map);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function boundaryStyle(feature, color, opacity, weight) {
    if (feature.properties.boundary === 'claimed') {
        return {
            color: color,
            weight: weight,
            opacity: opacity
        };
    } else {
        return {
            color: "transparent",
            weight: 0
        };
    }
}

let currentTileLayer;

//function which is called after modal window with 3 options select, draw, upload area
function attachDropdownEventListeners() {
    const dropdownToggle = document.querySelector('.swal2-container .dropdown-toggle');
    const selectedImg = dropdownToggle.querySelector('.selected-img');
    // Function to update button's image and text
    
    function updateButtonContent(imgSrc, text) {
        let imgElement = selectedImg;
        if (!imgElement) {
            imgElement = document.createElement('img');
            imgElement.className = 'selected-img';
            dropdownToggle.insertBefore(imgElement, dropdownToggle.firstChild);
        }
        imgElement.src = imgSrc;
        dropdownToggle.textContent = '';
        dropdownToggle.appendChild(imgElement);
        const mahaDropdown = document.getElementById("MahaDropdown");
        const IndiaStates = ["Maharashtra","Nagaland","Mizoram","Kerala","Jharkhand","Assam","Tamil_Nadu","Madhya_Pradesh"];
        if (IndiaStates.includes(text)) {
            dropdownToggle.appendChild(document.createTextNode(' ' + "India"));
            mahaDropdown.style.display = "block";
        } else {
            dropdownToggle.appendChild(document.createTextNode(' ' + text));
            mahaDropdown.style.display = "none";
        }

        if (text === "India") {
            country = "Maharashtra";
            mahaDropdown.style.display = "block";
        } else {
            country = text;
        }
        
        document.querySelectorAll('.option-boxes .box').forEach(box => {
            box.classList.remove('disabled');
        });
    }

    const selectedImageSrc = getCookie('selectedImageSrc');
    const selectedText = getCookie('selectedText');
    if (selectedImageSrc && selectedText) {
        updateButtonContent(selectedImageSrc, selectedText);
    };

    document.getElementById('dropdownMenu2').addEventListener('click', function () {
        const dropdown = document.getElementById('stateDropdown');
        
        //dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    document.querySelectorAll('#stateDropdown .dropdown-item').forEach(function (item) {
        item.addEventListener('click', function (event) {
        //const item = event.target.closest('.dropdown-item');
        if (item) {
            const selectedImageSrc = item.getAttribute('data-img');
            const selectedText = item.getAttribute('data-text');
            let changeSelect;
            if (selectedText === "India") {
                changeSelect = "Maharashtra";
            } else {
                changeSelect = selectedText;
            }
            const d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            const expires = "expires=" + d.toUTCString();
            document.cookie = "selectedImageSrc=" + encodeURIComponent(selectedImageSrc) + ";" + expires + ";path=/";
            document.cookie = "selectedText=" + encodeURIComponent(changeSelect) + ";" + expires + ";path=/";
            document.getElementById('dropdownMenu2').textContent = selectedText;
            let imgElement = selectedImg;
            if (!imgElement) {
                imgElement = document.createElement('img');
                imgElement.className = 'selected-img';
                dropdownToggle.insertBefore(imgElement, dropdownToggle.firstChild);
            }
            imgElement.src = selectedImageSrc;
            dropdownToggle.textContent = '';
            dropdownToggle.appendChild(imgElement);
            const mahaDropdown = document.getElementById("MahaDropdown");
            if (selectedText !== "Kenya") {
                dropdownToggle.appendChild(document.createTextNode(' ' + "India"));
                mahaDropdown.style.display = "block";
            } else {
                dropdownToggle.appendChild(document.createTextNode(' ' + selectedText));
                mahaDropdown.style.display = "none";
            }
                country = selectedText;
            
            
            document.querySelectorAll('.option-boxes .box').forEach(box => {
                box.classList.remove('disabled');
            });
        }
        setMapView(country);
        map.eachLayer(function (layer) {
            if (!(layer instanceof L.FeatureGroup)) {
                map.removeLayer(layer);
            }
        });
        if (getCookie('selectedText') === "Kenya") {
            if (currentTileLayer) {
                map.removeLayer(currentTileLayer);
            }
            currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 22,
                attribution: '&copy; OpenStreetMap contributors'
            });
            currentTileLayer.addTo(map);
            indiaBoundaries1.removeFrom(map);
            indiaBoundaries2.removeFrom(map);
        } else {
            if (currentTileLayer) {
                map.removeLayer(currentTileLayer);
            }
            currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                maxNativeZoom: 25,
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
            });
            currentTileLayer.addTo(map);
            addIndiaBoundaries();
        }
        map.on("zoomend", function () {
            if (getCookie('selectedText') !== "Kenya") {
                if (map.getZoom() > 17) {
                    map.setZoom(17);
                } else {
                    indiaBoundaries1.removeFrom(map);
                    indiaBoundaries2.removeFrom(map);
                    addIndiaBoundaries();
                }
            }
        });
        if (flag) {
            showCountyData()
        }       
        });
    });
    // Attach event listener to dropdown menu
    document.querySelector('.swal2-container .dropdown-menu').addEventListener('click', function (event) {
        const item = event.target.closest('.dropdown-item');
        if (item) {
            const selectedImageSrc = item.getAttribute('data-img');
            const selectedText = item.getAttribute('data-text');
            let changeSelect = selectedText;
            /*if (selectedText === "India") {
                changeSelect = "Maharashtra";
            } else {
                changeSelect = selectedText;
            }*/
            const d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            const expires = "expires=" + d.toUTCString();
            document.cookie = "selectedImageSrc=" + encodeURIComponent(selectedImageSrc) + ";" + expires + ";path=/";
            document.cookie = "selectedText=" + encodeURIComponent(changeSelect) + ";" + expires + ";path=/";
            updateButtonContent(selectedImageSrc, selectedText);
        }
        setMapView(country);
        map.eachLayer(function (layer) {
            if (!(layer instanceof L.FeatureGroup)) {
                map.removeLayer(layer);
            }
        });
        if (getCookie('selectedText') === "Kenya") {
            if (currentTileLayer) {
                map.removeLayer(currentTileLayer);
            }
            currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 22,
                attribution: '&copy; OpenStreetMap contributors'
            });
            currentTileLayer.addTo(map);
            indiaBoundaries1.removeFrom(map);
            indiaBoundaries2.removeFrom(map);
        } else {
            if (currentTileLayer) {
                map.removeLayer(currentTileLayer);
            }
            currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                maxNativeZoom: 25,
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
            });
            currentTileLayer.addTo(map);
            addIndiaBoundaries();
        }
        map.on("zoomend", function () {
            if (getCookie('selectedText') === "Maharashtra") {
                if (map.getZoom() > 17) {
                    map.setZoom(17);
                } else {
                    indiaBoundaries1.removeFrom(map);
                    indiaBoundaries2.removeFrom(map);
                    addIndiaBoundaries();
                }
            }
        });
        if (flag) {
            showCountyData()
        }
    });
}

//modal window with 3 options select, draw or upload
function openModal() {
    Swal.fire({
        html: `
            <h5 style="margin-top: 30px;margin-bottom: 30px;text-align: left;font-family: 'Barlow Condensed', sans-serif;font-size: 24px;color: #183F37;font-weight: 700;line-height: 23px;">Find an area to explore</h5>
                <div class="option-boxes">
                    <div class="box" id="selectArea" style="margin-right: 15px">
                        <div style="background-color: #F0F0F0; height: 227px; justify-content: center; display: grid;
                            align-items: center;">
                        <img src="resources/images/select.webp" alt="Image 1">
                        </div>
                        <h5>Select an Area</h5>
                        <p>Choose a predefined area based on administrative level 0, 1 & 2 per country</p>
                    </div>
                    <div class="box" id="drawAreaBox" style="margin-right: 15px">
                        <div style="background-color: #F0F0F0; height: 227px; justify-content: center; display: grid;
                            align-items: center;">
                        <img src="resources/images/draw.webp" alt="Image 2">
                        </div>
                        <h5>Draw an area</h5>
                        <p>Create an area directly on the map using your mouse to define the area of interest</p>
                    </div>
                    <div class="box" id="uploadShp">
                        <div style="background-color: #F0F0F0; height: 227px; justify-content: center; display: grid;
                            align-items: center;">
                        <img src="resources/images/shapefile.webp" alt="Image 3">
                        </div>
                        <h5>Upload a .shp</h5>
                        <p>Upload your own pre-defined area as a shapefile to use throughout the tool</p>
                    </div>
                </div>
            
        `,
        width: '810px',
        background: '#F8F3E9',
        showConfirmButton: false,
        didOpen: () => {

        }
    });
}
//function for incrementing uniq users and area searched
function incrementCounter(counterName, source) {
    $.ajax({
        type: 'POST',
        url: `${apiUrl}/counters`,
        contentType: 'application/json',
        data: JSON.stringify({ counterName: counterName, source: source }),
    }).done(function (result) {
    });
}
// first window of begin survey
function firstDialog() {
    Swal.fire({
        html: `
            <h5 style="color: #FFF9F0;font-weight: 700; font-size: 24px;line-height: 23px; padding-top: 35px">TELL US ABOUT YOURSELF</h5>
            <button type="submit" class="btn" id="skipBtn" style="color: #F7F6F2;font-weight: 400; font-size: 8px; position: absolute;line-height: 28px; top: 10px; left: 30px; margin: 10px;">Skip</button>
            <p style="color: #FFF9F0; font-weight: 400;line-height: 14px; font-size: 12px; padding-left: 55px; padding-right: 55px; padding-bottom: 15px">We believe in the power of personalized experiences to elevate your journey. To unlock the full potential of our tool, we'd like to get to know you a little better. </p>
            <div>
                <form style="padding-bottom: 20px"> 
                    <div class="row">
                        <!-- First column for input fields -->
                        <div class="col-md-6">
                            <div class="floating-label">
                                <div class="form-group">
                                    <input type="text" class="form-control" id="firstName" required>
                                    <label for="firstName">First Name</label>
                                </div>
                            </div>
                            <div class="floating-label">
                                <div class="form-group">
                                    <input type="text" class="form-control" id="lastName" required>
                                    <label for="firstName">Last Name</label>
                                </div>
                            </div>
                            <div class="floating-label">
                                <div class="form-group">
                                    <input type="email" class="form-control" id="userEmail" required>
                                    <label for="firstName">Email</label>
                                </div>
                            </div>
                        </div>
            
                        <!-- Second column for select boxes -->
                        <div class="col-md-6">
                            <div class="floating-label">
                                <div class="form-group">
                                    <select class="form-control" id="purpose">
                                        <option></option>
                                        <option>Advocacy and Awareness</option>
                                        <option>Benchmarking</option>
                                        <option>Data Analysis</option>
                                        <option>Decision Making</option>
                                        <option>Education and Training</option>
                                        <option>Energy Auditing</option>
                                        <option>Environmental Impact Assessment</option>
                                        <option>Grant Application</option>
                                        <option>Investment Analysis</option>
                                        <option>Performance Monitoring</option>
                                        <option>Planning and Strategy</option>
                                        <option>Policy Development</option>
                                        <option>Project Management</option>
                                        <option>Regulatory Compliance</option>
                                        <option>Reporting</option>
                                        <option>Research</option>
                                        <option>Resource Allocation</option>
                                        <option>Risk Assessment</option>
                                        <option>Stakeholder Engagement</option>
                                        <option>Technology Evaluation</option>
                                        <option>Other</option>
                                    </select>
                                    <label for="purpose">Purpose</label>
                                </div>
                            </div>
                            <div class="floating-label">    
                                <div class="form-group">
                                    <select class="form-control" id="role">
                                        <option></option>
                                        <optgroup label="Academia:">
                                            <option>Academic Researcher</option>
                                            <option>Research Assistant</option>
                                            <option>Undergraduate Student</option>
                                            <option>Graduate Student</option>
                                            <option>Postdoctoral Researcher</option>
                                            <option>Lecturer</option>
                                            <option>Department Chair</option>
                                            <option>Lab Technician</option>
                                            <option>Visiting Scholar</option>
                                        </optgroup>
                                        <optgroup label="Business Management and Administration:">
                                            <option>Business Development Manager</option>
                                            <option>Chief Administrative Officer (CAO)</option>
                                            <option>Chief Executive Officer (CEO)</option>
                                            <option>Chief Financial Officer (CFO)</option>
                                            <option>Chief Operations Officer (COO)</option>
                                            <option>Director General</option>
                                            <option>Project Manager</option>
                                        </optgroup>
                                        <optgroup label="Customer Relations and Sales:">
                                            <option>Customer Relations Manager</option>
                                            <option>Sales Manager</option>
                                        </optgroup>
                                        <optgroup label="Data Analysis and Technology:">
                                            <option>Data Analyst</option>
                                            <option>Data Scientist</option>
                                            <option>Geographic Information Systems (GIS) Specialist</option>
                                            <option>Technology Developer (developing energy-efficient technologies)</option>
                                        </optgroup>
                                        <optgroup label="Engineering and Architecture:">
                                            <option>Architect (interested in sustainable building design)</option>
                                            <option>Civil Engineer (with focus on infrastructure sustainability)</option>
                                            <option>Energy Efficiency Officer</option>
                                            <option>Energy Efficiency Specialist</option>
                                            <option>Energy Engineer</option>
                                            <option>Energy Systems Analyst</option>
                                        </optgroup>
                                        <optgroup label="Environmental and Sustainability:">
                                            <option>Carbon Analyst</option>
                                            <option>Climate Change Analyst</option>
                                            <option>Climate Change Officer</option>
                                            <option>Corporate Sustainability Manager</option>
                                            <option>Energy Analyst</option>
                                            <option>Energy Efficiency Consultant</option>
                                            <option>Energy Engineer</option>
                                            <option>Energy Policy Maker</option>
                                            <option>Energy Systems Analyst</option>
                                            <option>Environmental Engineer</option>
                                            <option>Environmental Health Officer</option>
                                            <option>Environmental Scientist</option>
                                            <option>Renewable Energy Developer</option>
                                            <option>Smart Grid Specialist</option>
                                            <option>Sustainability Officer</option>
                                        </optgroup>
                                        <optgroup label="Finance and Risk Management:">
                                            <option>Finance Analyst</option>
                                            <option>Insurance Underwriter</option>
                                            <option>Risk Analyst</option>
                                        </optgroup>
                                        <optgroup label="Government and Public Service:">
                                            <option>Economic Development Officer</option>
                                            <option>Government Analyst</option>
                                            <option>Government Official</option>
                                            <option>Minister</option>
                                            <option>NGO Representative</option>
                                            <option>Public Health Officer</option>
                                            <option>Urban Development Officer</option>
                                        </optgroup>
                                        <optgroup label="Infrastructure and Urban Planning:">
                                            <option>Building Inspector</option>
                                            <option>Infrastructure Development Officer</option>
                                            <option>Land Use Planner</option>
                                            <option>Transportation Planner</option>
                                            <option>Urban Development Planner</option>
                                        </optgroup>
                                        <optgroup label="Legal and Compliance:">
                                            <option>Legal Counsel</option>
                                            <option>Regulatory Compliance Officer</option>
                                        </optgroup>
                                        <optgroup label="Marketing and Public Relations:">
                                            <option>Marketing Manager</option>
                                            <option>Public Relations Officer</option>
                                        </optgroup>
                                        <optgroup label="Supply Chain and Procurement:">
                                            <option>Procurement Manager</option>
                                            <option>Supply Chain Manager</option>
                                            <option>Supply Chain Manager (interested in sustainable sourcing)</option>
                                        </optgroup>
                                        <optgroup label="Other">
                                            <option>Other</option>
                                        </optgroup>
                                    </select>
                                    <label for="role">Role</label>
                                </div>
                            </div>    
                            <div class="floating-label">
                                <div class="form-group">
                                    <select class="form-control" id="business">
                                        <option></option>
                                        <option>Academia</option>
                                        <option>Government</option>
                                        <option>Non-Governmental Organization (NGO)</option>
                                        <option>Non-Profit Organization</option>
                                        <option>International Organization</option>
                                        <option>Private</option>
                                        <option>Other</option>
                                    </select>
                                    <label for="business">Sector Type</label>
                                </div>
                            </div>    
                        </div>
                    </div>
                </form>
            </div>
            <button type="submit" class="btn" id="submitBtn" style="font-weight:700;font-size:16px;font-family: 'Barlow Condensed', sans-serif;background-color: #9BBE1D; color: #183F37; width: 125px; height: 32px; border-radius: 3px; padding: 0">NEXT</button>
            <p style="color: #F7F6F2; font-weight: 600; font-size: 8px; line-height: 14px; padding-top: 20px">By proceeding, you agree to our Privacy Policy and Terms of Service. Read about how we prioritize privacy here. By clicking "Next" or "Skip",
            you also agree to the storing of cookies on your device to enhance site navigation and provide future improvements to the user experience.</p>          
            
        `,
        width: '601px',
        background: '#183F37',
        backdrop: `
                    rgba(51, 57, 55, 0.898)
                `,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            document.getElementById('skipBtn').addEventListener('click', function (e) {
                e.preventDefault();
                const d = new Date();
                d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
                const expires = "expires=" + d.toUTCString();
                document.cookie = "survey=" + "true" + ";" + expires + ";path=/";
                incrementCounter("uniq_user_counter", environment);
                window.location.href = 'index.html';
            });
            document.getElementById('submitBtn').addEventListener('click', function (e) {
                e.preventDefault();
                var firstName = document.getElementById("firstName").value;
                var lastName = document.getElementById("lastName").value;
                var email = document.getElementById("userEmail").value;
                var purpose = document.getElementById("purpose").value;
                var role = document.getElementById("role").value;
                var business = document.getElementById("business").value;

                let fields = {
                    "First name": firstName,
                    "Last name": lastName,
                    "Email": email,
                    "Purpose": purpose,
                    "Role": role,
                    "Sector Type": business
                };

                let missingFields = [];

                for (let field in fields) {
                    if (fields[field] === "") {
                        missingFields.push(field);
                    }
                }

                if (missingFields.length > 0) {
                    alert("Please fill out the following fields: " + missingFields.join(", ") + "!");
                } else if (!email.includes("@")) {
                    alert("Wrong Email address!");
                } else {
                    beginSurvey.firstName = document.getElementById("firstName").value;
                    beginSurvey.lastName = document.getElementById("lastName").value;
                    beginSurvey.email = document.getElementById("userEmail").value;
                    beginSurvey.purpose = document.getElementById("purpose").value;
                    beginSurvey.role = document.getElementById("role").value;
                    beginSurvey.business = document.getElementById("business").value;
                    beginSurvey.integrate = false;
                    beginSurvey.browse = false;
                    beginSurvey.capture = false;
                    beginSurvey.source = environment;
                    var date = (new Date()).toString().split(' ').splice(1, 4).join(' ');
                    beginSurvey.date = date;
                    secondDialog();
                }

            });
        }
    });
}
// second window of begin survey
function secondDialog() {
    Swal.fire({
        html: `
            <h3 style="margin: 0; color: #F7F6F2; font-weight: 700; font-size: 24px; line-height: 23px; padding-top: 10px">How do you plan to use the tool?</h3>
            <p style="color: #FFF9F0; font-size: 10px; font-weight: 400; line-height: 12px; padding-top: 10px; text-align: center;">Choose the most important option</p>
            <div class="option-boxes-dialog" style="margin-bottom: 20px">
                <div class="box" id="integrateBox" style="height: auto; margin-right: 15px">
                    <span class="pin-order-little">1</span>
                    <img src="resources/images/integrate.png" alt="Image 2">
                    <h5>Integrate</h5>
                    <p>this data into other data analyzation tools</p>
                </div>
                <div class="box" id="browseBox" style="height: auto; margin-right: 15px">
                    <span class="pin-order-little">2</span>
                    <img src="resources/images/browse.png" alt="Image 2">
                    <h5>Browse</h5>
                    <p>detailed building data specific to various provnices</p>
                </div>
                <div class="box" id="captureBox" style="height: auto">
                    <span class="pin-order-little">3</span>
                    <img src="resources/images/capture.png" alt="Image 2">
                    <h5>Capture</h5>
                    <p>building info to collaborate with your team</p>
                </div>
            </div>
            <button type="submit" class="btn btn-outline-dark" id="bckBtn" style="font-family: 'Barlow Condensed', sans-serif;border-radius: 3px;height: 32px;padding: 0;width: 124px; color: #FFF9F0; border: 1.5px solid #9BBE1D;font-weight: 700;line-height: 19px;font-size: 16px">BACK</button>
            <button type="submit" class="btn" id="finishBtn" style="font-family: 'Barlow Condensed', sans-serif;margin-left: 5px;padding:0; background-color: #9BBE1D;height: 32px;width: 124px;color: #183F37;font-weight: 700;line-height: 28px;font-size: 16px">FINISH</button>
        `,
        width: '601px',
        background: '#183F37',
        backdrop: `
                    rgba(51, 57, 55, 0.898)
                `,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            // Back Button Logic
            document.getElementById('bckBtn').addEventListener('click', function (e) {
                e.preventDefault();
                console.log(JSON.stringify({ beginSurvey }));
                firstDialog();
                document.getElementById("firstName").value = beginSurvey.firstName;
                document.getElementById("lastName").value = beginSurvey.lastName;
                document.getElementById("userEmail").value = beginSurvey.email;
                document.getElementById("purpose").value = beginSurvey.purpose;
                document.getElementById("role").value = beginSurvey.role;
                document.getElementById("business").value = beginSurvey.business;
            });

            // Finish Button Logic with Cancelable Event
            document.getElementById('finishBtn').addEventListener('click', function (e) {
                // Create a cancelable custom event
                const customEvent = new CustomEvent("finishClick", { cancelable: true });

                // Dispatch event and check if it was canceled
                if (!document.dispatchEvent(customEvent)) {
                    console.warn("Event canceled");
                    return;
                }

                e.preventDefault();
                console.log(JSON.stringify({ beginSurvey }));
                const d = new Date();
                d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
                const expires = "expires=" + d.toUTCString();
                document.cookie = "survey=true; Secure; SameSite=None; " + expires + "; path=/";

                console.log("BeginSurvey: " + JSON.stringify({ beginSurvey }));

                $.ajax({
                    type: 'POST',
                    url: `${apiUrl}/survey`,
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify({
                        beginSurvey
                    }),
                    dataType: 'json',
                }).done(function (result) {
                }).fail(function () {
                    console.log("failed")
                });

                incrementCounter("uniq_user_counter", environment);
                Swal.close();
                openModal();
            });
            
        }
    });
}

// Example listener for the custom cancelable event
document.addEventListener("finishClick", (event) => {
    console.log("Custom event 'finishClick' triggered");
    //event.preventDefault();
});

//modal window for option select area
function openModalSelect() {
    Swal.fire({
        html: `
            <button onclick="enableFeatures()" id="bckBtn2" type="submit" class="btn" style="position: absolute;top: 45px; right: 20px;font-family: 'Barlow Condensed', sans-serif;border-radius: 3px;height: 32px;padding: 0;width: 124px; color: #183F37; border: 1.5px solid #183F37;font-weight: 700;line-height: 19px;font-size: 16px"><i class='bx bx-arrow-back' style="padding-right: 3px"></i>Back</button>
            <h5 style="margin-top: 30px;margin-bottom: 30px;text-align: left;font-family: 'Barlow Condensed', sans-serif;font-size: 24px;color: #183F37;font-weight: 700;line-height: 23px;">Select an area to explore</h5>
            <div style="display: flex; align-items: flex-start">
            <div  style="width: 236px">
                <p style="font-family: 'Barlow Condensed', sans-serif;font-size: 14px;color: #183F37;font-weight: 700;line-height: 23px;text-align: left; margin: 0;padding: 0">CHOOSE AN AVAILABLE COUNTRY</p>
                <div  class="btn-group" style="width: 100%; height: 41px; border-radius: 5px">
                    <button class="btn dropdown-toggle" style="background-color: #FFFFFF;border: 1px solid #9BBE1D;font-size: 12px;font-weight: 400;line-height: 28px;text-align: left; color: #183F37" type="button" id="dropdownMenuButton"
                            data-bs-toggle="dropdown">
                            Select a country
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton" id="countryDropdown">
                        <li>
                            <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left; color: #183F37" class="dropdown-item" href="#" data-img="resources/images/kenya.webp" data-text="Kenya">
                                <img src="resources/images/kenya.webp" alt="Kenya"> Kenya
                            </a>
                        </li>
                        <li>
                            <a style="width: 236px;font-size: 12px;text-decoration: none;font-weight: 400;line-height: 28px;text-align: left; color: #183F37" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="India">
                                <img src="resources/images/india.png" alt="India"> India
                            </a>
                        </li>
                    </ul>
                </div>
                    <div id="MahaDropdown" style="display: none">
                        <p style="font-family: 'Barlow Condensed', sans-serif;font-size: 14px;color: #183F37;font-weight: 700;line-height: 23px;text-align: left; margin: 0;padding: 0">CHOOSE AN AVAILABLE STATE</p>
                        <div class="btn-group" style="width: 100%">
                            <button class="btn dropdown-toggle" style="background-color: #FFFFFF;border: 1px solid #9BBE1D;font-size: 12px;font-weight: 400;line-height: 28px;text-align: left; color: #183F37;" type="button" id="dropdownMenu2"
                                    data-bs-toggle="dropdown">
                                    Maharashtra
                            </button>
                            <ul class="dropdown-menu"  style="position: absolute" aria-labelledby="dropdownMenu2" id="stateDropdown">
                                <li>
                                    <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left;color: #183F37;" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="Assam">
                                        Assam
                                    </a>
                                </li>
                                <li>
                                    <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left;color: #183F37;" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="Jharkhand">
                                        Jharkhand
                                    </a>
                                </li>
                                <li>
                                    <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left;color: #183F37;" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="Kerala">
                                        Kerala
                                    </a>
                                </li>
                                <li>
                                    <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left;color: #183F37;" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="Madhya_Pradesh">
                                        Madhya Pradesh
                                    </a>
                                </li>
                                <li>
                                    <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left;color: #183F37;" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="Maharashtra">
                                        Maharashtra
                                    </a>
                                </li>
                                <li>
                                    <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left;color: #183F37;" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="Mizoram">
                                        Mizoram
                                    </a>
                                </li>
                                <li>
                                    <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left;color: #183F37;" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="Nagaland">
                                        Nagaland
                                    </a>
                                </li>
                                <li>
                                    <a style="width: 236px;font-size: 12px;font-weight: 400;text-decoration: none;line-height: 28px;text-align: left;color: #183F37;" class="dropdown-item" href="#" data-img="resources/images/india.png" data-text="Tamil_Nadu">
                                        Tamil Nadu
                                    </a>
                                </li>   
                            </ul>
                        </div>
                    </div>
            </div>
                <div style="display: flex; justify-content: space-evenly; padding-left: 50px;">
                    <div>
                        <div style="margin-right: 30px; border-left: 1px solid #D8D8D8; padding-left: 25px; width: 263px">
                    <p style="font-family: 'Barlow Condensed', sans-serif;font-size: 14px;color: #183F37;font-weight: 700;line-height: 23px;text-align: left; margin: 0;padding: 0">SELECT AN AREA</p>
                    <select size="7" onfocus='this.size=7;' onblur='this.size=7;' 
                onchange='this.size=1; this.blur();' id="areaSelect" 
                style="width: 100%; background-color: #F8F3E9">
                    </select>
                    <button class="btn btn-dark btn-sm my-2" type="button" id="viewAreaButton" style="font-family: 'Barlow Condensed', sans-serif;width: 100%; background-color: #183F37;display: none; font-size: 16px;font-weight: 700;color: #FFF9F0">VIEW DATA FOR THIS AREA</button>
                        </div>
                    </div>
                    <div>
                    <div id="subAreaDiv" style="display: none; margin-right: 30px; border-left: 1px solid #D8D8D8; padding-left: 25px;">
                    <p style="font-family: 'Barlow Condensed', sans-serif;font-size: 14px;color: #183F37;font-weight: 700;line-height: 23px;text-align: left; margin: 0;padding: 0">SELECT A SUB-AREA</p>
                    <select size="7" onfocus='this.size=7;' onblur='this.size=7;' 
                onchange='this.size=1; this.blur();' id="subAreaSelect" style="width: 100%;background-color: #F8F3E9">
                    </select>
                    <button class="btn btn-dark btn-sm my-2" type="button" id="viewSubAreaButton" style="font-family: 'Barlow Condensed', sans-serif;width: 100%; background-color: #183F37;font-size: 16px;font-weight: 700;color: #FFF9F0">VIEW DATA FOR THIS SUB-AREA</button>
                    </div>
                    </div>
                    
                </div>
            </div>    
            
        `,
        width: '1104px',
        background: '#F8F3E9',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            attachDropdownEventListeners();
            showCountyData();
        }
    });
}
// modal window for option upload shapefile
function openModalUpload() {
    Swal.fire({
        html: `
            <button onclick="enableFeatures()" id="bckBtn2" type="submit" class="btn" style="position: absolute;top: 45px; right: 20px;font-family: 'Barlow Condensed', sans-serif;border-radius: 3px;height: 32px;padding: 0;width: 124px; color: #183F37; border: 1.5px solid #183F37;font-weight: 700;line-height: 19px;font-size: 16px"><i class='bx bx-arrow-back' style="padding-right: 3px"></i>Back</button>
            <h5 style="margin-top: 30px;margin-bottom: 30px;text-align: left;font-family: 'Barlow Condensed', sans-serif;font-size: 24px;color: #183F37;font-weight: 700;line-height: 23px;">EXPLORE AN AREA ON YOUR OWN</h5>
            <div style="display: flex; justify-content: center">
                <div id="dragDropArea" style="display: flex;align-content: center;justify-content: center;flex-wrap: wrap;;border: 1px dashed #9BBE1D; width: 541px; height: 387px; margin-right:5px">
                    <input type="file" id="fileInput" multiple style="display: none;" accept=".shp,.shx,.dbf,.prj">
                    <div style="justify-content:center;">
                        <img src="resources/images/noun-upload.png" alt="Image 3" style="width: 60px; height: 60px; margin: 20px">
                        <p style="color: #183F37;font-size: 14px;font-weight: 500;line-height: 18px;text-align: center;">Drag and drop file here or <span style="text-decoration: underline;">Choose file</span></p>
                        <!-- Container for the list of uploaded files -->
                        <div id="fileList" style="margin-top: 20px;"></div>
                        <!-- Progress bar -->
                        <div id="uploadProgress" style="width: 150%; height: 10px; background-color: black; display: none;">
                            <div id="progressBar" style="height: 100%; background-color: black; width: 0%;"></div>
                        </div>
                    </div>
                </div>
                <div class="option-boxes" style="padding: 0">
                        <div class="box" id="uploadShapeFile">
                            <div style="background-color: #F6F6F6; border-bottom: 1px solid black; height: 227px; justify-content: center; display: grid;
                                align-items: center;">
                            <img src="resources/images/shapefile.webp" alt="Image 3">
                            </div>
                            <hr style="margin: 0">
                            <h5>UPLOAD A .SHP</h5>
                            <p style="font-size: 10px;font-weight: 300;line-height: 14px;text-align: center; margin: 5px">Upload your own pre-defined area to use throughout the tool. We’ll need all four files ending with .shp, .shx, .prj and .dbf)</p>
                        </div>
                </div>
            </div>
            <p style="color: #506561;font-size: 10px;font-weight: 500;line-height: 18px; margin-left: 200px">Maximum size: 25MB</p>
            
        `,
        width: '1104px',
        background: '#F8F3E9',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            uploadFunction();
        }
    });
}
var selectedFiles = [];

function uploadFunction() {
    var fileInput = document.getElementById('fileInput');
    var dragDropArea = document.getElementById('dragDropArea');
    var fileList = document.getElementById('fileList');
    var uploadedFileTypes = new Set();

    selectedFiles = [];

    dragDropArea.addEventListener('click', function (e) {
        if (uploadedFileTypes.size < 4) {
            fileInput.click();
        } else {
            alert("Maximum of four files have already been uploaded.");
        }
    });

    dragDropArea.addEventListener('dragover', preventDefaults, false);
    dragDropArea.addEventListener('dragenter', preventDefaults, false);
    dragDropArea.addEventListener('dragleave', preventDefaults, false);
    dragDropArea.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', function (e) {
        handleFiles(e.target.files);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        e.preventDefault();
        var dt = e.dataTransfer;
        var files = dt.files;

        if (uploadedFileTypes.size >= 4) {
            alert("Maximum of four files have already been uploaded.");
            return;
        }

        handleFiles(files);
    }

    function handleFiles(files) {
        var validFiles = Array.from(files).filter(file => validateFileType(file));
        validFiles.forEach(file => {
            selectedFiles.push(file);
        });
        uploadFiles(validFiles);
    }

    function validateFileType(file) {
        var fileExtension = file.name.split('.').pop().toLowerCase();
        if (uploadedFileTypes.has(file.name)) {
            var existingFileExtension = Array.from(uploadedFileTypes).filter(name => name === file.name)[0].split('.').pop().toLowerCase();
            alert("File with extension ." + existingFileExtension + " has already been uploaded.");
            return false;
        }
        if (['shp', 'shx', 'dbf', 'prj'].includes(fileExtension)) {
            uploadedFileTypes.add(file.name);
            return true;
        } else {
            alert("Invalid file type with ." + fileExtension + " extension.");
            return false;
        }
    }

    function uploadFiles(files) {
        files.forEach(file => {
            var fileDiv = document.createElement('div');
            fileList.appendChild(fileDiv);

            var fileName = document.createElement('span');
            fileName.textContent = file.name;
            fileDiv.appendChild(fileName);

            var fileImg = document.createElement('img');
            fileImg.src = "resources/images/shapefileImg.png";
            fileImg.alt = "File Icon";
            fileImg.style.width = "20px";
            fileImg.style.height = "20px";
            fileDiv.appendChild(fileImg);

            var reader = new FileReader();
            reader.onloadstart = function () {
                // Display progress bar
                var progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                fileDiv.appendChild(progressBar);
            };
            reader.onprogress = function (event) {
                var progressBar = fileDiv.querySelector('.progress-bar');
                if (event.lengthComputable) {
                    var percentLoaded = Math.round((event.loaded / event.total) * 100);
                    progressBar.style.width = percentLoaded + '%';
                }
            };
            reader.onloadend = function () {
                var progressBar = fileDiv.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.display = 'none';
                }
            };

            reader.readAsArrayBuffer(file);
        });
    }
}
const decoder = new TextDecoder("utf-8");

// loading bar when buildings are fetching from database
function loadingBar(number) {
    var elem = document.getElementById("myBar");
    if (number >= 0 && number <= 100) {
        elem.style.width = number + "%";
    }
}

//function for reading data by chunks - called when area is selected
async function readData(url) {
    let unzippedHeader = {};
    let unzippedBody = {};
    const zipfile = await fetch(urlGeoJSON + url.replace(".json", ".zip"));
    const reader = zipfile.body.getReader();
    let total_bytes = zipfile.headers.get('Content-Length')
    let received_total = 0
    var fileContentArray = new Uint8Array(total_bytes);
    setLoadingText('Downloading');
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        for (let i = 0; i < value.length; i++) { 
            fileContentArray[received_total+i] = value[i];
        }
        received_total += value.length
        let percent = received_total / total_bytes;
        loadingBar(Math.round(percent * 100))
    }
    fileContent = new Blob([fileContentArray]);
    //console.log(fileContent);
    var new_zip = new JSZip();
    zip = await new_zip.loadAsync(fileContent)
    uzBlob = await zip.files[url.replace(".json", ".geojson")].async('blob');
    const uzReader = uzBlob.stream().getReader();
    let uzTotal = uzBlob.size
    //console.log(uzTotal);
    let uzRead = 0;
    let geojsonheader = ''
    let buildings1 = ''
    let buildings2 = ''
    let item_flag = true
    let featuresFlag = true
    let loadbar = document.getElementById("myBar");
    setLoadingText('Unpacking')
    while (true) {
        const { done, value } = await uzReader.read();
        if (done) {
            break;
        }
        uzRead += value.length
        let half = uzRead / uzTotal;
        loadbar.style.backgroundColor = '#37983a';
        loadingBar(Math.round(half * 100))
        let stringValue = decoder.decode(value);
        let splitted_chunk = stringValue.split(" ");
        let i = 0;
        while (i < splitted_chunk.length) {
            if (featuresFlag) {
                if (splitted_chunk[i] === `"features":`) {
                    featuresFlag = false
                } else {
                    geojsonheader = geojsonheader.concat(splitted_chunk[i])
                }
            } else {
                if (half <= 0.5) {
                    buildings1 = buildings1.concat(splitted_chunk[i])
                } else {
                    if (item_flag) {
                        if (splitted_chunk[i] !== "{\"type\":") {
                            buildings1 = buildings1.concat(splitted_chunk[i])
                        } else {
                            item_flag = false
                            buildings2 = buildings2.concat(splitted_chunk[i])
                        }
                    } else {
                        buildings2 = buildings2.concat(splitted_chunk[i])
                    }
                }
            }
            i++;
        }
    }
    geojsonheader = geojsonheader.substring(0, geojsonheader.length - 1);
    geojsonheader = geojsonheader.concat('}')
    buildings1 = buildings1.substring(1)
    buildings1 = buildings1.substring(0, buildings1.length - 1);
    buildings1 = buildings1.substring(0, buildings1.length - 1);
    buildings1 = buildings1.concat("}")
    buildings2 = buildings2.substring(0, buildings2.length - 1);
    buildings2 = buildings2.substring(0, buildings2.length - 1);
    let featureCollection1 = JSON.parse(`{"type": "FeatureCollection", "features": [${buildings1}]}`);
    let featureCollection2 = JSON.parse(`{"type": "FeatureCollection", "features": [${buildings2}]}`);
    let combinedFeatures = featureCollection1.features.concat(featureCollection2.features);
    let combinedFeatureCollection = {
        "type": "FeatureCollection",
        "features": combinedFeatures
    };
    /*unzippedHeader = {
        "type": "FeatureCollection",
        "county_properties": JSON.parse(fileData).county_properties
    };
    unzippedBody = {
        "type": "FeatureCollection",
        "features": JSON.parse(fileData).features
    };*/
    //console.log(unzippedHeader)
    //console.log(unzippedBody)
    //return [unzippedHeader, unzippedBody]
    return [JSON.parse(geojsonheader), combinedFeatureCollection];
}

let url;
let countyCounterName;

//function which saves information about created polygon, in which area was this polygon created
function countiesStats(countyName) {
    $.ajax({
        type: 'POST',
        url: `${apiUrl}/stats`,
        contentType: 'application/json',
        data: JSON.stringify({ countyName: countyName, country: country }),
    }).done(function (result) {
    });
}
function areaInCounty(coordinates) {
    let centroid = turf.centroid(turf.polygon([coordinates]));
    let filePath;
    switch (country) {
        case 'Kenya':
            filePath = 'resources/district_boundaries/Kenya_districts.geojson';
            break;
        case 'Maharashtra':
            filePath = 'resources/district_boundaries/Maharashtra_districts.json';
            break;
        case 'Nagaland':
            filePath = 'resources/district_boundaries/Nagaland_districts.geojson';
            break;   
        case 'Mizoram':
            filePath = 'resources/district_boundaries/Mizoram_districts.geojson';
            break;
        case 'Kerala':
            filePath = 'resources/district_boundaries/Kerala_districts.geojson';
            break;
        case 'Jharkhand':
            filePath = 'resources/district_boundaries/Jharkhand_districts.geojson';
            break;
        case 'Assam':
            filePath = 'resources/district_boundaries/Assam_districts.geojson';
            break;
        case 'Tamil_Nadu':
            filePath = 'resources/district_boundaries/Tamil_Nadu.geojson';
            break;
        case 'Madhya_Pradesh':
            filePath = 'resources/district_boundaries/Madhya_Pradesh.geojson';
            break;
    }
    var countyOrDistrict;
    $.getJSON(filePath, function (json) {
        json.features.forEach(function (feature) {
            if (turf.booleanPointInPolygon(centroid, feature.geometry)) {
                if (feature.properties.county) {
                    countyOrDistrict = feature.properties.county
                } else {
                    countyOrDistrict = feature.properties.district
                }
                countiesStats(countyOrDistrict)
            }
        });
    });

}
// function displaying all area and sub areas in dropdown for chosen country
function showCountyData() {
    flag = true;

    const areaSelect = document.getElementById('areaSelect');
    const subAreaSelect = document.getElementById('subAreaSelect');
    const viewAreaButton = document.getElementById('viewAreaButton');
    const viewSubAreaButton = document.getElementById('viewSubAreaButton');
    let selectedArea;

    function fetchCountiesForCountry(countryName) {
        fetch('https://counties-geojsons.s3.eu-de.cloud-object-storage.appdomain.cloud/geojson_subdistricts_map.json')
            .then(response => response.json())
            .then(data => {
                if (data[countryName] && areaSelect) {
                    let counties = Object.keys(data[countryName]);
                    areaSelect.innerHTML = '';
                    counties.sort();
                    counties.forEach(area => {
                        const option = document.createElement('option');
                        option.value = area;
                        option.textContent = area;
                        option.className = 'select-option';
                        areaSelect.appendChild(option);
                    });
                    viewAreaButton.style.display = 'block';
                    viewAreaButton.disabled = true;
                    document.getElementById('subAreaDiv').style.display = 'none';
                    areaSelect.addEventListener('change', function () {
                        countyCounterName = areaSelect.value;
                        const selectedCounty = this.value;
                        let countyData = data[countryName][selectedCounty];
                        subAreaSelect.innerHTML = '';
                        if (typeof countyData === 'string') {
                            viewAreaButton.disabled = false;
                            document.getElementById('subAreaDiv').style.display = 'none';
                            url = countyData;
                            selectedArea = areaSelect.value;
                            viewAreaButton.style.display = 'block';
                        } else if (typeof countyData === 'object') {
                            document.getElementById('subAreaDiv').style.display = 'block';
                            document.getElementById('subAreaDiv').style.width = '300px';
                            viewSubAreaButton.style.display = 'block';
                            viewSubAreaButton.disabled = true;
                            Object.entries(countyData).forEach(([subArea, path]) => {
                                const option = document.createElement('option');
                                option.value = path;
                                option.textContent = subArea;
                                subAreaSelect.appendChild(option);
                            });
                            viewAreaButton.style.display = 'none';
                            subAreaSelect.addEventListener('change', function () {
                                viewSubAreaButton.disabled = false;
                                url = this.value;
                                selectedArea = subAreaSelect.options[subAreaSelect.selectedIndex].textContent;
                            });
                        }
                    });
                }
            })
            .catch(error => console.error('Error fetching data:', error));
    }
    fetchCountiesForCountry(country);
    if (viewAreaButton) {
        viewAreaButton.addEventListener('click', function () {
            buttonsListener(url)
        });
    }
    if (viewSubAreaButton) {
        viewSubAreaButton.addEventListener('click', function () {
            buttonsListener(url)
        });
    }

    function getCityName(url, country, countyCounterName) {
        let cleanFilename = url.replace(".json", "");
        let parts = cleanFilename.split("_");
        let countryIndex = parts.indexOf(country);
        let countyParts = countyCounterName.split("_");
        let countyIndex = parts.indexOf(countyParts[0], countryIndex + 1);
        if (countyIndex !== -1 && countryIndex === 0) {
          let matchedCounty = parts
            .slice(countyIndex, countyIndex + countyParts.length)
            .join("_");
          if (matchedCounty === countyCounterName) {
            let result =
              countyIndex + countyParts.length < parts.length
                ? parts.slice(countyIndex + countyParts.length).join("_")
                : countyCounterName;
            return result.replace(/_/g, " ");
          }
        }
        return url.split("_").pop().split(".")[0];
      }
      
      function buttonsListener(url) {
        if (url) {
          const cityName = getCityName(url, country, countyCounterName);
            Swal.fire({
                html: '<div><img src="resources/images/loading.gif" alt="Loading"/></div>' +
                    '<div style="text-align: start; margin-left: 36%">' +
                        '<p id="loading-text"></p><span id="loading-dot"></span>' +
                    '</div>' +
                    '<div id="myProgress">\n' +
                    '  <div id="myBar"></div>\n' +
                    '</div>',
                title: 'We are processing your request....',
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            readData(url)
                .then(([geojsonHeader, buildings]) => {
                    Swal.fire(
                        geojsonHeader.county_properties.count_of_buildings + ' buildings',
                        'So many buildings were processed.',
                        'success'
                    ).then(function () {
                        showBuildings(geojsonHeader.county_properties, buildings, cityName, null);
                    });
                })
                .catch(error => {
                    console.error('Failed to fetch data:', error);
                });
        } else {
            console.log("No area selected");
        }
    }
}


(function () {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }

                form.classList.add('was-validated')
            }, false)
        })

    // intercept the click on the submit button, add the coordinates entry
    $(document).on('click', '#submitButton', async function (e) {
        e.preventDefault();
        // first check how many building there is, then trigger loading from DB

        if (polygonCoordinates.length > 0) {
            Swal.fire({
                html: '<div><img src="resources/images/loading.gif" alt="Loading"/></div>',
                title: 'We are processing your request....',
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            for (let i = 0; i < polygonCoordinates.length; i++) {
                await countOfMultiBuildingsRequest.add(polygonCoordinates[i].getSouth(), polygonCoordinates[i].getWest(), polygonCoordinates[i].getNorth(), polygonCoordinates[i].getEast, latLngs[i], place, country);
            }

            Swal.fire(resultMulti.count + ' buildings', 'So many buildings were processed. ' + resultMulti.msg, 'success').then(function () {
                showBuildingsMulti(resultMulti);
            });

        } else {
            countOfBuildingsRequst.add(polygonCoordinates.getSouth(), polygonCoordinates.getWest(), polygonCoordinates.getNorth(), polygonCoordinates.getEast, latLngs, place, country)
        }
        place = ""
    });
})()

// Fetch and open GeoJSON on click
function fetchAndOpenGeoJSON(url) {
    var geoJsonURL = 'http://geojson.io/#data=data:text/x-url,' + encodeURIComponent(url);
    window.open(geoJsonURL, '_blank');
}

//function for adding urban, suburban overlay on interactive map for chosen country
function addOverlay(map, country) {
    let filePath;
    switch (country) {
        case 'Kenya':
            filePath = 'resources/assets/urban_split_Kenya.json';
            break;
        case 'Maharashtra':
            filePath = 'resources/assets/urban_split_India_Maharashtra.json';
            break;
        case 'Nagaland':
            filePath = 'resources/assets/urban_split_East-India_Nagaland.json';
            break;
        case 'Mizoram':
            filePath = 'resources/assets/urban_split_East-India_Mizoram.json';
            break;
        case 'Kerala':
            filePath = 'resources/assets/urban_split_South-India_Kerala.json';
            break;
        case 'Jharkhand':
            filePath = 'resources/assets/urban_split_East-India_Jharkhand.json';
            break; 
        case 'Assam':
            filePath = 'resources/assets/urban_split_East-India_Assam.json';
            break;
        case 'Tamil_Nadu':
            filePath = 'resources/assets/urban_split_South-India_Tamil_Nadu.json';
            break;
        case 'Madhya_Pradesh':
            filePath = 'resources/assets/urban_split_Madhya_Pradesh.json';
            break;     
        default:
            filePath = 'resources/assets/urban_split_Kenya.json';
            break;
    }
    $.getJSON(filePath, function (json) {
        map.createPane('lowerPane');
        map.getPane('lowerPane').style.zIndex = 300;
        json.features.forEach(function (feature) {
            var layer = L.geoJSON(feature, {
                pane: 'lowerPane',
                style: feature.properties.seg_type === "URBAN" ?
                    { color: 'brown', weight: 1, opacity: 0.5, fillOpacity: 0.5 } :
                    { color: 'brown', weight: 1, opacity: 0.2, fillOpacity: 0.2 }
            });

            layer.addTo(map);
            overlayLayers.push(layer);
        });
    });
}

//function for adding internet overlay on interactive map for chosen country

function addInternetOverlay(map, country) {
    let filePath;
    switch (country) {
        case 'Kenya':
            filePath = 'resources/assets/internet_speed_Kenya.json';
            document.getElementById('verySlow').style.display = 'none';
            document.getElementById('veryHighValue').textContent = 'Very high (>50Mb/s)';
            document.getElementById('highValue').textContent = 'High (~35Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~15Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~3Mb/s)';
            break;
        case 'Maharashtra':
            filePath = 'resources/assets/internet_speed_India_Maharashtra.json';
            document.getElementById('verySlow').style.display = 'block';
            document.getElementById('veryHighValue').textContent = 'Very high (>110Mb/s)';
            document.getElementById('highValue').textContent = 'High (~90Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~50Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~20Mb/s)';
            document.getElementById('verySlowValue').textContent = 'Very Slow (~5Mb/s)';
            break;
        case 'Nagaland':
            filePath = 'resources/assets/internet_speed_India_Nagaland.json';
            document.getElementById('verySlow').style.display = 'block';
            document.getElementById('veryHighValue').textContent = 'Very high (>110Mb/s)';
            document.getElementById('highValue').textContent = 'High (~90Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~50Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~20Mb/s)';
            document.getElementById('verySlowValue').textContent = 'Very Slow (~5Mb/s)';
            break;
        case 'Mizoram':
            filePath = 'resources/assets/internet_speed_India_Mizoram.json';
            document.getElementById('verySlow').style.display = 'block';
            document.getElementById('veryHighValue').textContent = 'Very high (>110Mb/s)';
            document.getElementById('highValue').textContent = 'High (~90Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~50Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~20Mb/s)';
            document.getElementById('verySlowValue').textContent = 'Very Slow (~5Mb/s)';
            break;
        case 'Kerala':
            filePath = 'resources/assets/internet_speed_India_Kerala.json';
            document.getElementById('verySlow').style.display = 'block';
            document.getElementById('veryHighValue').textContent = 'Very high (>110Mb/s)';
            document.getElementById('highValue').textContent = 'High (~90Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~50Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~20Mb/s)';
            document.getElementById('verySlowValue').textContent = 'Very Slow (~5Mb/s)';
            break;
        case 'Jharkhand':
            filePath = 'resources/assets/internet_speed_India_Jharkhand.json';
            document.getElementById('verySlow').style.display = 'block';
            document.getElementById('veryHighValue').textContent = 'Very high (>110Mb/s)';
            document.getElementById('highValue').textContent = 'High (~90Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~50Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~20Mb/s)';
            document.getElementById('verySlowValue').textContent = 'Very Slow (~5Mb/s)';
            break; 
        case 'Assam':
            filePath = 'resources/assets/internet_speed_India_Assam.json';
            document.getElementById('verySlow').style.display = 'block';
            document.getElementById('veryHighValue').textContent = 'Very high (>110Mb/s)';
            document.getElementById('highValue').textContent = 'High (~90Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~50Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~20Mb/s)';
            document.getElementById('verySlowValue').textContent = 'Very Slow (~5Mb/s)';
            break;
        case 'Tamil_Nadu':
            filePath = 'resources/assets/internet_speed_India_Tamil_Nadu.json';
            document.getElementById('verySlow').style.display = 'block';
            document.getElementById('veryHighValue').textContent = 'Very high (>110Mb/s)';
            document.getElementById('highValue').textContent = 'High (~90Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~50Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~20Mb/s)';
            document.getElementById('verySlowValue').textContent = 'Very Slow (~5Mb/s)';
            break;
        case 'Madhya_Pradesh':
            filePath = 'resources/assets/internet_speed_India_Madhya_Pradesh.json';
            document.getElementById('verySlow').style.display = 'block';
            document.getElementById('veryHighValue').textContent = 'Very high (>110Mb/s)';
            document.getElementById('highValue').textContent = 'High (~90Mb/s)';
            document.getElementById('normalValue').textContent = 'Normal (~50Mb/s)';
            document.getElementById('slowValue').textContent = 'Slow (~20Mb/s)';
            document.getElementById('verySlowValue').textContent = 'Very Slow (~5Mb/s)';
            break;    
        default:
            filePath = 'resources/assets/internet_speed_Kenya.json';
            break;
    }
    $.getJSON(filePath, function (json) {
        map.createPane('lowerPane');
        map.getPane('lowerPane').style.zIndex = 300;
        var styles = {
            "very_high": { color: 'red', weight: 2, opacity: 0.5, fillOpacity: 0.5 },
            "high": { color: 'orange', weight: 2, opacity: 0.4, fillOpacity: 0.4 },
            "normal": { color: 'yellow', weight: 1, opacity: 0.3, fillOpacity: 0.3 },
            "slow": { color: 'green', weight: 1, opacity: 0.3, fillOpacity: 0.3 },
            "very_slow": { color: 'blue', weight: 1, opacity: 0.3, fillOpacity: 0.3 }
        };
        json.features.forEach(function (feature) {
            var layer = L.geoJSON(feature, {
                pane: 'lowerPane',
                style: function (feature) {
                    return styles[feature.properties.speed_category] || {
                        color: 'grey',
                        weight: 1,
                        opacity: 0.2,
                        fillOpacity: 0.2
                    };
                }
            });
            layer.addTo(map);
            overlayInternetLayers.push(layer);
        });
    });
    document.getElementById('netColors').style.display = 'block';
}

function removeInternetOverlay(map) {
    overlayInternetLayers.forEach(function (layer) {
        map.removeLayer(layer);
    });
    overlayInternetLayers = [];
    document.getElementById('netColors').style.display = 'none';
}

function removeOverlay(map) {
    overlayLayers.forEach(function (layer) {
        map.removeLayer(layer);
    });
    overlayLayers = [];
}

function enableFeatures() {
    openModal()
    map.on('mousemove', function (e) {
        tooltip.setLatLng(e.latlng);
        map.openTooltip(tooltip);
    });

    map.on('click', function () {
        openModal();
    });
}

function setUpCountry() {
    submitButton.style.display = 'block';
    const d = new Date();
    d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    let imgPath;
    if (country === "Kenya") {
        imgPath = "resources/images/kenya.webp";
    } else if (country === "Maharashtra") {
        imgPath = "resources/images/india.png";
    } else if (country === "Nagaland") {
        imgPath = "resources/images/india.png";
    } else if (country === "Mizoram") {
        imgPath = "resources/images/india.png";
    } else if (country === "Kerala") {
        imgPath = "resources/images/india.png";
    } else if (country === "Jharkhand") {
        imgPath = "resources/images/india.png";
    } else if (country === "Assam") {
        imgPath = "resources/images/india.png";
    } else if (country === "Tamil_Nadu") {
        imgPath = "resources/images/india.png";
    } else if (country === "Madhya_Pradesh") {
        imgPath = "resources/images/india.png";
    }
    document.cookie = "selectedImageSrc=" + encodeURIComponent(imgPath) + ";" + expires + ";path=/";
    document.cookie = "selectedText=" + encodeURIComponent(country) + ";" + expires + ";path=/";
}

//function for recognise country where polygon was created and switch cookies to that Country
function findCountryByPolygon(centroid) {
    let bboxFilePath = 'resources/district_boundaries/countries_bboxes.json';
    $.getJSON(bboxFilePath, function (json) {
        countryCandidates = [];
        json.countries.forEach(function (mycountry) {
            if ((mycountry.minlat <= turf.getCoord(centroid)[1]) && (mycountry.maxlat >= turf.getCoord(centroid)[1]) && (mycountry.minlong <= turf.getCoord(centroid)[0]) && (mycountry.maxlong >= turf.getCoord(centroid)[0])) {
                countryCandidates.push(mycountry.name);
            }
        })
        if (countryCandidates.length === 1) {
            country = countryCandidates[0];
            setUpCountry();
        } else {
            countryCandidates.forEach(function (candidate) {
                let filePath = 'resources/district_boundaries/perCountry/'+candidate+'.json';
                $.getJSON(filePath, function (json) {
                    if (turf.booleanPointInPolygon(centroid, json.features[0].geometry)) {
                        country = json.features[0].properties.state;
                        setUpCountry();
                    }
                })
            })
        }
    })
    /*let filePath = 'resources/district_boundaries/Countries_boundaries.json';
    $.getJSON(filePath, function (json) {
        json.features.forEach(function (feature) {
            if (turf.booleanPointInPolygon(centroid, feature.geometry)) {
                country = feature.properties.state;
                submitButton.style.display = 'block';
                const d = new Date();
                d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
                const expires = "expires=" + d.toUTCString();
                let imgPath;
                if (country === "Kenya") {
                    imgPath = "resources/images/kenya.webp";
                } else if (country === "Maharashtra") {
                    imgPath = "resources/images/india.png";
                } else if (country === "Nagaland") {
                    imgPath = "resources/images/india.png";
                } else if (country === "Mizoram") {
                    imgPath = "resources/images/india.png";
                } else if (country === "Kerala") {
                    imgPath = "resources/images/india.png";
                } else if (country === "Jharkhand") {
                    imgPath = "resources/images/india.png";
                } else if (country === "Assam") {
                    imgPath = "resources/images/india.png";
                } else if (country === "Tamil_Nadu") {
                    imgPath = "resources/images/india.png";
                } else if (country === "Madhya_Pradesh") {
                    imgPath = "resources/images/india.png";
                }
                document.cookie = "selectedImageSrc=" + encodeURIComponent(imgPath) + ";" + expires + ";path=/";
                document.cookie = "selectedText=" + encodeURIComponent(country) + ";" + expires + ";path=/";
            }
        });
    });*/
}
$(document).ready(function () {
    $('#infoHelp').on('click', function () {
        Swal.fire({
            title: 'Visit OSM, select area which you want to scan. Copy N,S,W,E',
            html: '<a href="https://www.openstreetmap.org/export" target=_blank>https://www.openstreetmap.org/export</a> '
        })
    });
    $('#apiInfo').on('click', function () {
        window.open(`https://${apiUrl.split('/')[2]}/api-docs/`, '_blank');
    });

    // Initialize the Leaflet map
    map = L.map('map', { zoomControl: true, maxZoom: 22 }).setView([0, 40], 7);
    setMapView = function (country) {
        if (country === "Kenya") {
            map.setView([0, 40], 7);
        } else if (country === "Maharashtra") {
            map.setView([25, 80], 5);
        } else if (country === "Nagaland") {
            map.setView([26, 94], 5);
        } else if (country === "Mizoram") {
            map.setView([24, 93], 5);
        } else if (country === "Kerala") {
            map.setView([10, 77], 5);
        } else if (country === "Jharkhand") {
            map.setView([23, 85], 5);
        } else if (country === "Assam") {
            map.setView([26, 93], 5);
        } else if (country === "Tamil_Nadu") {
            map.setView([11, 79], 5);
        } else if (country === "Madhya_Pradesh") {
            map.setView([23, 78], 5);
        } else {
            console.log("Country not recognized");
            return;
        }
    }
    setMapView(getCookie('selectedText'))
    if (getCookie('selectedText') === "Kenya") {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 22,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
    } else {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxNativeZoom: 25,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
        }).addTo(map);
    }
    addIndiaBoundaries();
    map.on("zoomend", function () {
        if (getCookie('selectedText') === "Maharashtra") {
            if (map.getZoom() > 17) {
                map.setZoom(17);
            } else {
                indiaBoundaries1.removeFrom(map);
                indiaBoundaries2.removeFrom(map);
                addIndiaBoundaries();
            }
        }
    });
    // Tooltip initialization
    tooltip = L.tooltip({
        permanent: false,
        sticky: true,
        interactive: false
    }).setContent("Please click for creating area.");

    function disableFeatures() {
        map.off('mousemove');
        map.off('click');
    }

    //enableFeatures();
    if (getCookie("survey")) {
        // if (true) {
        enableFeatures();
    } else {
        firstDialog();
    }

    //map legend checkboxes
    L.control.scale({ position: 'bottomright', maxWidth: 100 }).addTo(map);
    document.getElementById('urbanSuburbanCheckbox').addEventListener('change', function () {
        if (this.checked) {
            addOverlay(map, country);
        } else {
            removeOverlay(map);
        }
    });

    document.getElementById('internetCheckbox').addEventListener('change', function () {
        if (this.checked) {
            addInternetOverlay(map, country);
        } else {
            removeInternetOverlay(map);
        }
    });

    activePopupTab = 'param1';

    // Add polygons and markers for each row in the table
    var drawnItems = new L.FeatureGroup().addTo(map);
    var drawControl = new L.Control.Draw({
        draw: {
            polygon: {
                shapeOptions: {
                    color: 'red',
                    weight: 2,
                    opacity: 0.6,
                    fillOpacity: 0.1,
                }
            }, circle: false, marker: false, circlemarker: false, polyline: false, rectangle: false
        }, edit: {
            featureGroup: drawnItems
        },
    });
    //function fo visualize all fetched buildings on map
    showBuildings = function (entry, geoJSON, selectedArea, drawCoordinates) {
        if (environment === "prod") {
            if (drawCoordinates) {
                areaInCounty(drawCoordinates)
            } else {
                countiesStats(countyCounterName);
            }
        }
        incrementCounter("search_area_counter", environment);
        document.getElementById('backButton').addEventListener('click', function () {
            location.reload();
        });
        document.getElementById("editIcon").addEventListener("click", function () {
            var editableElement = document.getElementById("editableStat");
            editableElement.contentEditable = true;
            editableElement.focus();

            var range = document.createRange();
            var sel = window.getSelection();
            range.selectNodeContents(editableElement);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        });
        let nameOfArea;
        document.getElementById("editableStat").addEventListener("input", function () {
            if (this.innerText.length > 20) {
                this.innerText = this.innerText.substring(0, 10);
                var range = document.createRange();
                var sel = window.getSelection();
                range.selectNodeContents(this);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            nameOfArea = this.innerHTML;
        });
        document.getElementById('downloadGeoJSONButton').addEventListener('click', function () {
            var fileUrl;
            if (entry.county_polygon_coordinates) {
                document.getElementById('hiddenGeoJSONDownloadLink').setAttribute('href', urlGeoJSON + url.replace("json", 'zip'));
                document.getElementById('hiddenGeoJSONDownloadLink').click();
            } else {
                document.getElementById('hiddenREADMEDownloadLink').setAttribute('href', 'README.txt');
                document.getElementById('hiddenREADMEDownloadLink').setAttribute('download', 'README.txt');
                document.getElementById('hiddenREADMEDownloadLink').click();
                fileUrl = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geoJSON));
                var downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", fileUrl);
                var today = new Date();
                var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
                let nameFinal;
                let editableName = document.getElementById("editableStat").innerHTML;
                if (editableName !== "Name") {
                    nameFinal = editableName
                } else {
                    nameFinal = ""
                }
                var fileName = dateStr + "_" + nameFinal + "_" + country + ".geojson";
                downloadAnchorNode.setAttribute("download", fileName);

                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            }

        });
        //css
        document.getElementById('sidePanel').style.display = 'block';
        document.getElementById('map').style.width = 'calc(100% - 300px)';
        document.getElementById('map').style.left = '150px';
        document.getElementById('mapLegend').style.left = '357px';
        //sidepanel values
        if (entry.square_area) {
            document.getElementById('squareArea').innerHTML = (entry.square_area / 1000000).toFixed(2);
        } else {
            document.getElementById('squareArea').innerHTML = (entry.square_area_of_county / 1000000).toFixed(2);
        }

        document.getElementById('buildingsHeight').innerHTML = entry.height_avg.toFixed(2);
        //Urban Split
        if (entry.urban) {
            document.getElementById('urban').innerHTML = entry.urban;
        } else {
            document.getElementById('urban').innerHTML = "0";
        }

        if (entry.suburban) {
            document.getElementById('suburban').innerHTML = entry.suburban;
        } else {
            document.getElementById('suburban').innerHTML = "0";
        }
        if (entry.rural) {
            document.getElementById('rural').innerHTML = entry.rural;
        } else {
            document.getElementById('rural').innerHTML = "0";
        }

        // For residential buildings
        document.getElementById('resBuildings').innerHTML = entry.count_of_buildings_res;
        document.getElementById('resBuildingsArea').innerHTML = (entry.square_area_res / 1000000).toFixed(4);
        document.getElementById('resBuildingsConfidence').innerHTML = (entry.model_confidence_res * 100).toFixed(2);
        // For non-residential buildings
        document.getElementById('nonResBuildings').innerHTML = entry.count_of_buildings_nonRes;
        document.getElementById('nonResBuildingsArea').innerHTML = (entry.square_area_nonRes / 1000000).toFixed(4);
        document.getElementById('nonResBuildingsConfidence').innerHTML = (entry.model_confidence_nonRes * 100).toFixed(2);

        document.getElementById('resident').style.display = 'block';
        document.getElementById('nonResident').style.display = 'block';
        document.getElementById('inActive').style.display = 'block';
        document.getElementById('legend').style.display = 'block';
        disableFeatures()
        submitButton.style.display = 'none';
        drawControl.remove(map);
        var buildingLayers = [];
        if (entry.county_polygon_coordinates) {
            document.getElementById('editIcon').style.display = 'none';
            document.getElementById('editableStat').innerHTML = selectedArea;
            let coordinates = entry.county_polygon_coordinates;
            var polygon = turf.polygon([coordinates]);
            var layer = L.geoJSON(polygon, {
                style: {
                    color: 'red', weight: 2, opacity: 0.6, fillOpacity: 0.1
                },
            }).addTo(map);
        } else {
            polygon = turf.polygon([drawCoordinates]);
            layer = L.geoJSON(polygon, {
                style: {
                    color: 'red', weight: 2, opacity: 0.6, fillOpacity: 0.1
                },
            });
        }
        var bounds = layer.getBounds();
        var center = bounds.getCenter();
        map.fitBounds(bounds);
        geoJSON.features.forEach(function (feature) {
            try {
                var layer = L.geoJSON(feature, {
                    style: function (feature) {
                        if (feature.properties.res_type === "res" || feature.properties.classification_type === "res") {
                            return { color: 'blue', weight: 1, opacity: 0.5, fillOpacity: 0.5 };
                        } else if (feature.properties.res_type === "non-res" || feature.properties.classification_type === "non-res") {
                            return { color: 'purple', weight: 1, opacity: 0.5, fillOpacity: 0.5 };
                        } else {
                            return { color: 'grey', weight: 1, opacity: 0.8, fillOpacity: 0.8 };
                        }
                    },
                    onEachFeature: function (feature, layer) {
                        if (feature.properties.res_type === "res" || feature.properties.classification_type === "res" || feature.properties.res_type === "non-res" || feature.properties.classification_type === "non-res") {
                            layer.on('mouseover', function (e) {
                                var content = createPopupContent(feature.properties);
                                showTemporaryPopup(e.latlng, content, feature);
                            });
                            layer.on('mouseout', function () {
                                removeTemporaryPopup();
                            });
                            layer.on('click', function (e) {
                                var content = createPopupContent(feature.properties);
                                createDraggablePopup(e.latlng, content, feature, e);
                                removeTemporaryPopup();
                            });
                        }
                    }
                });
                buildingLayers.push(layer);
            } catch (error) {
                console.error('Error:', feature);
            }
        });


        var tempPopup;

        function showTemporaryPopup(latlng, content, feature) {
            removeTemporaryPopup();  // Remove any existing temporary popup
            if (feature.properties.classification_type) {
                classificationType = feature.properties.classification_type;
            } else {
                classificationType = feature.properties.res_type;
            }
            var gradientColorEnd = classificationType === 'res' ? '#0000cd' : '#800080';
            var statsNameContent = classificationType === 'res' ? 'Residential' : 'Non-Residential';
            if (feature.properties.osm_type) {
                statsNameContent = feature.properties.osm_type.replaceAll("_", " ").replace(/([A-Z])/g, ' $1').trim();
            }
            var mapContainer = document.getElementById('map');
            tempPopup = document.createElement('div');
            tempPopup.className = 'custom-popup temporary-popup';
            tempPopup.innerHTML = '<div class="popup-content">' +
                '<div class="popup-header" style="background: linear-gradient(to right, #ccc, ' + gradientColorEnd + '); justify-content: center">' +
                '<span class="statsName">' + statsNameContent + ' Building' + '</span>' +
                '</div>' +
                '<div class="popup-body">' +
                content +
                '</div>' +
                '</div>';

            mapContainer.appendChild(tempPopup);

            // Position the temporary popup with an offset
            var point = map.latLngToContainerPoint(latlng);
            var offset = { x: 15, y: 15 }; // Offset values
            var left = point.x + offset.x;
            var top = point.y + offset.y;

            // Ensure the popup is within the visible map area and adjust position
            var mapRect = mapContainer.getBoundingClientRect();
            var popupRect = tempPopup.getBoundingClientRect();

            // Adjust horizontal position
            if (left + popupRect.width > mapRect.width) {
                left = point.x - popupRect.width - offset.x;
            }
            if (left < 0) {
                left = point.x + offset.x;
            }

            // Adjust vertical position
            if (top + popupRect.height > mapRect.height) {
                top = point.y - popupRect.height - offset.y;
            }
            if (top < 0) {
                top = point.y + offset.y;
            }

            tempPopup.style.left = left + 'px';
            tempPopup.style.top = top + 'px';
        }

        function removeTemporaryPopup() {
            if (tempPopup) {
                tempPopup.remove();
                tempPopup = null;
            }
        }
        function addSpaceBeforeCaps(input) {
            let result = input.replace(/([a-z])([A-Z])/g, '$1 $2');
            result = result.replace(/(\()([A-Z])/g, ' $1$2');

            return result;
        }

        function createPopupContent(properties) {
            // Tab 1: General
            var tab1Content = '<table>';
            tab1Content += '<tr><th>Coordinates</th><td>' + parseFloat(properties.latitude) + ', ' + parseFloat(properties.longitude) + '</td></tr>';
            tab1Content += '<tr><th>Footprint Source</th><td>' + (properties.footprint_source || properties.source) + '</td></tr>';
            if (properties.type_source) {
                const confidence = properties.confidence || (properties.ml_confidence * 100).toFixed(2);
                if ((properties.type_source == "OSMDerived") || (properties.type_source == "OSM Derived")) {
                    tab1Content += '<tr><th>Building Type Source</th><td>OSM Derived</td></tr>';
                } else {
                    tab1Content += '<tr><th>Building Type Source (Confidence)</th><td>' + properties.type_source + ' (' + confidence + ' %)</td></tr>';
                }
            } else {
                if (properties.source === "osm") {
                    tab1Content += '<tr><th>Building Type Source</th><td>OSM Derived</td></tr>';
                }
            }
            tab1Content += '<tr><th>GHS-SMOD</th><td>' + (addSpaceBeforeCaps(properties.ghsl_smod) || 'N/A') + '</td></tr>';
            //tab1Content += '<tr><th>Elevation</th><td>' + (properties.elevation || 'N/A') + ' m</td></tr>';
            tab1Content += '</table>';
        
            // Tab 2: Location
            var tab2Content = '<table>';
            tab2Content += '<tr><th>Height</th><td>' + properties.height + ' m (' + properties.floors + ' floors)</td></tr>';
            tab2Content += '<tr><th>Roof Area</th><td>' + parseFloat(properties.area_in_meters).toFixed(2) + ' m²</td></tr>';
            tab2Content += '<tr><th>Building Faces</th><td>' + properties.building_faces + '</td></tr>';
            tab2Content += '<tr><th>Perimeter</th><td>' + parseFloat(properties.perimeter_in_meters).toFixed(2) + ' m</td></tr>';
            tab2Content += '<tr><th>Gross Floor Area</th><td>' + parseFloat(properties.gfa_in_meters).toFixed(2) + ' m²</td></tr>';
            tab2Content += '</table>';
        
            // Tab 3: Electricity (Kenya Only)
            var tab3Content = '<table>';
            tab3Content += '<tr><th>Coordinates</th><td>' + parseFloat(properties.latitude) + ', ' + parseFloat(properties.longitude) + '</td></tr>';
            tab3Content += '<tr><th>Electricity Data Source</th><td>Open Energy Maps</td></tr>';
            if (typeof properties.elec_access_percent === "string") {
                tab3Content += '<tr><th>Electricity Access</th><td>N/A</td></tr>';
                tab3Content += '<tr><th>Electricity Consumption</th><td>N/A</td></tr>';
            } else {
                tab3Content += '<tr><th>Electricity Access</th><td>' + parseFloat(properties.elec_access_percent).toFixed(2) + ' %</td></tr>';
                tab3Content += '<tr><th>Electricity Consumption</th><td>' + parseFloat(properties.elec_consumption_kwh_month).toFixed(1) + ' kWh/month</td></tr>';
            }
            tab3Content += '</table>';
        
            // Tab 4: Solar Potential
            var tab4Content = '<table>';
            tab4Content += '<tr><th>Coordinates</th><td>' + parseFloat(properties.latitude) + ', ' + parseFloat(properties.longitude) + '</td></tr>';
            tab4Content += '<tr><th>Data Source</th><td>' + (properties.footprint_source || properties.source) + '</td></tr>';
            tab4Content += '<tr><th>Non-shaded Usable Roof Area</th><td>' + (properties.usable_roof_area || 'N/A') + '</td></tr>';
            tab4Content += '<tr><th>Optimal Tilt</th><td>' + (properties.optimal_tilt || 'N/A') + '</td></tr>';
            tab4Content += '<tr><th>Potential with Flat Panels</th><td>' + (properties.potential_flat_panels || 'N/A') + '</td></tr>';
            tab4Content += '<tr><th>Potential with Optimal Tilt</th><td>' + (properties.potential_optimal_tilt || 'N/A') + '</td></tr>';
            tab4Content += '</table>';
            
            displayTab1 = 'none';
            displayTab2 = 'none';
            displayTab3 = 'none';
            displayTab4 = 'none';
            switch(activePopupTab) {
                case "param1":
                    displayTab1 = 'block';
                    break;
                case "param2":
                    displayTab2 = 'block';
                    break;
                case "param3":
                    displayTab3 = 'block';
                    break;
                case "param4":
                    displayTab4 = 'block';
                    break;
            }

            return `
                <div class="popup-page" id="param1" style="display: ${displayTab1};">${tab1Content}</div>
                <div class="popup-page" id="param2" style="display: ${displayTab2};">${tab2Content}</div>
                <div class="popup-page" id="param3" style="display: ${displayTab3};">${tab3Content}</div>
                <div class="popup-page" id="param4" style="display: ${displayTab4};">${tab4Content}</div>
            `;
        }

        window.setViewOnFeature = function (coordinates) {
            var latlngs = coordinates[0].map(function (coord) {
                return [coord[1], coord[0]];
            });
            var highlightedLayer = L.polygon(latlngs, {
                color: 'red',
                weight: 3,
                opacity: 0.7,
                fillOpacity: 0.3
            }).addTo(map);

            setTimeout(function () {
                map.removeLayer(highlightedLayer);
            }, 5000);
        }

        // Define a custom Leaflet icon class
        var CustomIcon = L.Icon.extend({
            options: {
                shadowUrl: 'resources/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            }
        });

        var black = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-black.png' });
        var blue = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-blue.png' });
        var gold = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-gold.png' });
        var green = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-green.png' });
        var grey = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-grey.png' });
        var orange = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-orange.png' });
        var red = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-red.png' });
        var violet = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-violet.png' });
        var yellow = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-yellow.png' });

        var markerIcons = [black, blue, gold, green, grey, orange, red, violet, yellow];
        var iconCounter = 0;

        function createDraggablePopup(latlng, content, feature, e) {
            var mapContainer = document.getElementById('map');
            var popupContainer = document.createElement('div');
            var coordinates = feature.geometry.coordinates;
            var classificationType;
        
            var latlngs = coordinates[0].map(function (coord) {
                return L.latLng(coord[1], coord[0]);
            });
            var center = L.latLngBounds(latlngs).getCenter();
        
            var icon = markerIcons[iconCounter];
            iconCounter = (iconCounter + 1) % markerIcons.length;
        
            var centerMarker = L.marker(center, { icon: icon }).addTo(map).bindPopup("I am a marker with a unique icon.");
        
            if (feature.properties.classification_type) {
                classificationType = feature.properties.classification_type;
            } else {
                classificationType = feature.properties.res_type;
            }
            var gradientColorEnd = classificationType === 'res' ? '#0000cd' : '#800080';
            var statsName = classificationType === 'res' ? 'Residential' : 'Non-Residential';
            if (feature.properties.osm_type) {
                statsName = feature.properties.osm_type.replaceAll("_", " ");
            }
        
            var tabContent = createPopupContent(feature.properties);
            tabButtonStyle1 = 'popup-tab';
            tabButtonStyle2 = 'popup-tab';
            tabButtonStyle3 = 'popup-tab';
            tabButtonStyle4 = 'popup-tab';
            switch(activePopupTab) {
                case "param1":
                    tabButtonStyle1 = 'popup-tab active';
                    break;
                case "param2":
                    tabButtonStyle2 = 'popup-tab active';
                    break;
                case "param3":
                    tabButtonStyle3 = 'popup-tab active';
                    break;
                case "param4":
                    tabButtonStyle4 = 'popup-tab active';
                    break;
            }
        
            popupContainer.className = 'custom-popup';
            popupContainer.innerHTML = `
                <div class="popup-content">
                    <div class="popup-header" style="background: linear-gradient(to right, #ccc, ${gradientColorEnd});">
                        <img src="${icon.options.iconUrl}" class="popup-icon" style="width: 20px; height: 30px; margin-top: 2px; margin-left: 5px;" />
                        <span class="statsName">${statsName} Building</span>
                        <span class="close-btn" onclick="window.closePopup(this)">
                            <i class='bx bx-x-circle' style='color:#ffffff'></i>
                        </span>
                    </div>
                    <div class="popup-tabs">
                        <button class="${tabButtonStyle1}" data-tab="param1">General</button>
                        <button class="${tabButtonStyle2}" data-tab="param2">Characteristics</button>
                        ${
                            country === "Kenya" 
                            ? '<button class="'+tabButtonStyle3+'" data-tab="param3">Electricity</button>' 
                            : ''
                        }
                        ${  false
                            ? '<button class="'+tabButtonStyle4+'" data-tab="param4">Solar Potential</button>'
                            : ''
                        }
                    </div>
                    <div class="popup-body">
                        ${tabContent}
                    </div>
                </div>
            `;
        
            mapContainer.appendChild(popupContainer);
        
            popupContainer.centerMarker = centerMarker;
        
            var point = map.latLngToContainerPoint(latlng);
            var offset = { x: 15, y: 15 };
            var left = point.x + offset.x;
            var top = point.y + offset.y;
        
            var mapRect = mapContainer.getBoundingClientRect();
            var popupRect = popupContainer.getBoundingClientRect();
        
            if (left + popupRect.width > mapRect.width) {
                left = point.x - popupRect.width - offset.x;
            }
            if (left < 0) {
                left = point.x + offset.x;
            }
        
            if (top + popupRect.height > mapRect.height) {
                top = point.y - popupRect.height - offset.y;
            }
            if (top < 0) {
                top = point.y + offset.y;
            }
        
            popupContainer.style.left = left + 'px';
            popupContainer.style.top = top + 'px';
        
            makePopupDraggable(popupContainer);

            const tabs = popupContainer.querySelectorAll('.popup-tab');
            const pages = popupContainer.querySelectorAll('.popup-page');
        
            tabs.forEach(tab => {
                tab.addEventListener('click', function () {
                    tabs.forEach(t => t.classList.remove('active'));
                    pages.forEach(p => p.style.display = 'none');
        
                    this.classList.add('active');
                    const targetPage = this.getAttribute('data-tab');
                    if (activePopupTab != targetPage) {
                        activePopupTab = targetPage
                        const allTabs = document.querySelectorAll('.popup-tab');
                        allTabs.forEach(mytab => {
                            if (mytab.getAttribute('data-tab') === activePopupTab) {
                                mytab.click();
                            }
                        })
                    }
                    popupContainer.querySelector(`#${targetPage}`).style.display = 'block';
                });
            });
        }
        
        window.closePopup = function (element) {
            var popup = element.closest('.custom-popup');
            if (popup) {
                if (popup.centerMarker) {
                    map.removeLayer(popup.centerMarker);
                }
                popup.remove();
            }
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
        };   

        function bringPopupToFront(popupElement) {
            var popups = document.querySelectorAll('.custom-popup');
            popups.forEach(function (popup) {
                if (popup === popupElement) {
                    popup.style.zIndex = 1000; // Bring the clicked popup to the front
                } else {
                    popup.style.zIndex = 999; // Send other popups behind
                }
            });
        }
        function makePopupDraggable(popupElement) {
            var header = popupElement.querySelector('.popup-header');
            header.style.cursor = 'move';

            header.onmousedown = function (e) {
                bringPopupToFront(popupElement); // Bring this popup to the front
                e.preventDefault();  // Prevent text selection
                // Disable map dragging
                map.dragging.disable();

                var posX = e.clientX, posY = e.clientY, elementX = popupElement.offsetLeft, elementY = popupElement.offsetTop;

                document.onmousemove = function (e) {
                    e.preventDefault();  // Prevent text selection
                    var dx = e.clientX - posX, dy = e.clientY - posY;
                    popupElement.style.left = elementX + dx + 'px';
                    popupElement.style.top = elementY + dy + 'px';
                };

                document.onmouseup = function () {
                    // Re-enable map dragging
                    document.onmousemove = document.onmouseup = null;
                };
            };

            // Prevent text selection
            header.onselectstart = function () {
                return false;
            };

            // Disable map events when hovering over the popup
            popupElement.onmouseenter = function () {
                map.dragging.disable();
                map.scrollWheelZoom.disable();
                map.doubleClickZoom.disable();
            };

            // Re-enable map events when not hovering over the popup
            popupElement.onmouseleave = function () {
                map.dragging.enable();
                map.scrollWheelZoom.enable();
                map.doubleClickZoom.enable();
            };

            // Allow interactions with the popup without affecting the map
            popupElement.onmousedown = function (e) {
                bringPopupToFront(popupElement); // Bring this popup to the front
                e.stopPropagation();
            };
        }


        var initialSelectionDone = false; // Flag to track if initial selection is done

        buildingLayers.forEach(function (layer) {
            layer.selected = false;
        });
        var northEastArray = [], northWestArray = [], southEastArray = [], southWestArray = [];


        var offsetLng = (bounds.getEast() - bounds.getWest()) * 0.5;
        var offsetLat = (bounds.getNorth() - bounds.getSouth()) * 0.5;

        buildingLayers.forEach(function (layer) {
            var buildingCenter = layer.getBounds().getCenter();

            var isWest = buildingCenter.lng < center.lng + offsetLng;
            var isEast = buildingCenter.lng > center.lng - offsetLng;
            var isSouth = buildingCenter.lat < center.lat + offsetLat;
            var isNorth = buildingCenter.lat > center.lat - offsetLat;
            if (isWest && isNorth) northWestArray.push(layer);
            if (isEast && isNorth) northEastArray.push(layer);
            if (isWest && isSouth) southWestArray.push(layer);
            if (isEast && isSouth) southEastArray.push(layer);
        });
        //more effective way for visualizing buildings on map, when moving on map, reduce percentage of buildings in zoom level
        function updateBuildingVisibility() {
            var currentZoom = map.getZoom();
            var mapBounds = map.getBounds();

            var layersToUpdate;
            if (!initialSelectionDone) {
                layersToUpdate = buildingLayers;
            } else {
                var currentCenter = map.getCenter();

                function filterLayers(layers) {
                    return layers.filter(function (layer) {
                        var layerBounds = layer.getBounds();
                        var isInViewport = layerBounds.intersects(mapBounds);
                        return isInViewport && (!layer.selected || currentZoom >= 16);
                    });
                }

                if (currentZoom >= 16) {
                    var quarterArray;
                    if (currentCenter.lng < center.lng) {
                        quarterArray = currentCenter.lat < center.lat ? southWestArray : northWestArray;
                    } else {
                        quarterArray = currentCenter.lat < center.lat ? southEastArray : northEastArray;
                    }
                    layersToUpdate = filterLayers(quarterArray);
                } else {
                    layersToUpdate = filterLayers(buildingLayers);
                }
            }
            layersToUpdate.forEach(function (layer) {
                if (currentZoom >= 16) {
                    // At zoom level 16, display all buildings
                    if (!map.hasLayer(layer)) {
                        map.addLayer(layer);
                    }
                } else {
                    // For other zoom levels
                    if (!initialSelectionDone) {
                        // If initial selection not done, select buildings based on the defined probability
                        layer.selected = buildingLayers.length > 800000 ? Math.random() < 0.002 : buildingLayers.length > 400000 ? Math.random() < 0.004 :
                            buildingLayers.length > 30000 ? Math.random() < 0.005 :
                                Math.random() < 0.2;
                    }

                    if (layer.selected) {
                        if (!map.hasLayer(layer)) {
                            map.addLayer(layer);
                        }
                    } else {
                        if (map.hasLayer(layer)) {
                            map.removeLayer(layer);
                        }
                    }
                }
            });

            // After first execution, set flag to true
            if (!initialSelectionDone) {
                initialSelectionDone = true;
            }
        }

        updateBuildingVisibility()
        let zoomIn = false;
        map.on('moveend', function () {
            if (map.getZoom() >= 16) {
                zoomIn = true;
                updateBuildingVisibility();
            }
            if (zoomIn && map.getZoom() <= 15) {
                zoomIn = false;
                updateBuildingVisibility();
            }
        });

    }

    showBuildingsMulti = function (result) {

        if (environment === "prod") {
            if (result.coordinates.length > 0) {
                for (let i = 0; i < result.coordinates.length; i++) {
                    areaInCounty(result.coordinates[i])
                }
            } else {
                countiesStats(countyCounterName);
            }
        }
        incrementCounter("search_area_counter", environment);
        document.getElementById('backButton').addEventListener('click', function () {
            location.reload();
        });
        document.getElementById("editIcon").addEventListener("click", function () {
            var editableElement = document.getElementById("editableStat");
            editableElement.contentEditable = true;
            editableElement.focus();

            var range = document.createRange();
            var sel = window.getSelection();
            range.selectNodeContents(editableElement);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        });
        let nameOfArea;
        document.getElementById("editableStat").addEventListener("input", function () {
            if (this.innerText.length > 20) {
                this.innerText = this.innerText.substring(0, 10);
                var range = document.createRange();
                var sel = window.getSelection();
                range.selectNodeContents(this);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            nameOfArea = this.innerHTML;
        });
        document.getElementById('downloadGeoJSONButton').addEventListener('click', function () {
            var fileUrl;
            if (result.entry.filter(x => x.county_polygon_coordinates).length > 0) {
                document.getElementById('hiddenGeoJSONDownloadLink').setAttribute('href', urlGeoJSON + url.replace("json", 'zip'));
                document.getElementById('hiddenGeoJSONDownloadLink').click();
            } else {
                document.getElementById('hiddenREADMEDownloadLink').setAttribute('href', 'README.txt');
                document.getElementById('hiddenREADMEDownloadLink').setAttribute('download', 'README.txt');
                document.getElementById('hiddenREADMEDownloadLink').click();
                fileUrl = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.geoJSON));
                var downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", fileUrl);
                var today = new Date();
                var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
                let nameFinal;
                let editableName = document.getElementById("editableStat").innerHTML;
                if (editableName !== "Name") {
                    nameFinal = editableName
                } else {
                    nameFinal = ""
                }
                var fileName = dateStr + "_" + nameFinal + "_" + country + ".geojson";
                downloadAnchorNode.setAttribute("download", fileName);

                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            }

        });
        //css
        document.getElementById('sidePanel').style.display = 'block';
        document.getElementById('map').style.width = 'calc(100% - 300px)';
        document.getElementById('map').style.left = '150px';
        document.getElementById('mapLegend').style.left = '357px';

        const entries = {
            square_area: 0,
            square_area_of_county: 0,
            height_avg: 0,
            urban: 0,
            suburban: 0,
            rural: 0,
            count_of_buildings_res: 0,
            square_area_res: 0,
            model_confidence_res: 0,
            square_area_nonRes: 0,
            count_of_buildings_nonRes: 0,
            model_confidence_nonRes: 0
        }

        for (let i = 0; i < result.entry.length; i++) {
            entries.square_area += result.entry[i].square_area;
            entries.square_area_of_county += result.entry[i].square_area_of_county;
            entries.height_avg += result.entry[i].height_avg;
            entries.urban += result.entry[i].urban;
            entries.suburban += result.entry[i].suburban;
            entries.rural += result.entry[i].rural;
            entries.count_of_buildings_res += result.entry[i].count_of_buildings_res;
            entries.square_area_res += result.entry[i].square_area_res;
            entries.model_confidence_res += result.entry[i].model_confidence_res;
            entries.square_area_nonRes += result.entry[i].square_area_nonRes;
            entries.count_of_buildings_nonRes += result.entry[i].count_of_buildings_nonRes;
            entries.model_confidence_nonRes += result.entry[i].model_confidence_nonRes;
        }


        //sidepanel values
        if (entries.square_area) {
            document.getElementById('squareArea').innerHTML = (entries.square_area / 1000000).toFixed(2);
        } else {
            document.getElementById('squareArea').innerHTML = (entries.square_area_of_county / 1000000).toFixed(2);
        }

        document.getElementById('buildingsHeight').innerHTML = entries.height_avg.toFixed(2);
        //Urban Split
        if (entries.urban) {
            document.getElementById('urban').innerHTML = entries.urban;
        } else {
            document.getElementById('urban').innerHTML = "0";
        }

        if (entries.suburban) {
            document.getElementById('suburban').innerHTML = entries.suburban;
        } else {
            document.getElementById('suburban').innerHTML = "0";
        }
        if (entries.rural) {
            document.getElementById('rural').innerHTML = entries.rural;
        } else {
            document.getElementById('rural').innerHTML = "0";
        }

        // For residential buildings
        document.getElementById('resBuildings').innerHTML = entries.count_of_buildings_res;
        document.getElementById('resBuildingsArea').innerHTML = (entries.square_area_res / 1000000).toFixed(4);
        document.getElementById('resBuildingsConfidence').innerHTML = (entries.model_confidence_res * 100).toFixed(2);
        // For non-residential buildings
        document.getElementById('nonResBuildings').innerHTML = entries.count_of_buildings_nonRes;
        document.getElementById('nonResBuildingsArea').innerHTML = (entries.square_area_nonRes / 1000000).toFixed(4);
        document.getElementById('nonResBuildingsConfidence').innerHTML = (entries.model_confidence_nonRes * 100).toFixed(2);

        document.getElementById('resident').style.display = 'block';
        document.getElementById('nonResident').style.display = 'block';
        document.getElementById('inActive').style.display = 'block';
        document.getElementById('legend').style.display = 'block';
        disableFeatures()
        submitButton.style.display = 'none';
        drawControl.remove(map);
        var buildingLayers = [];
        for (let i = 0; i < result.entry.length; i++) {
            if (result.entry[i].county_polygon_coordinates) {
                document.getElementById('editIcon').style.display = 'none';
                document.getElementById('editableStat').innerHTML = "";
                let coordinates = result.entry[i].county_polygon_coordinates;
                var polygon = turf.polygon([coordinates]);
                var layer = L.geoJSON(polygon, {
                    style: {
                        color: 'red', weight: 2, opacity: 0.6, fillOpacity: 0.1
                    },
                }).addTo(map);
            } else {
                polygon = turf.polygon([result.coordinates[i]]);
                layer = L.geoJSON(polygon, {
                    style: {
                        color: 'red', weight: 2, opacity: 0.6, fillOpacity: 0.1
                    },
                });
            }

            var bounds = layer.getBounds();
            var center = bounds.getCenter();
            map.fitBounds(bounds);

            result.geoJSON[i].features.forEach(function (feature) {
                try {
                    var layer = L.geoJSON(feature, {
                        style: function (feature) {
                            if (feature.properties.res_type === "res" || feature.properties.classification_type === "res") {
                                return { color: 'blue', weight: 1, opacity: 0.5, fillOpacity: 0.5 };
                            } else if (feature.properties.res_type === "non-res" || feature.properties.classification_type === "non-res") {
                                return { color: 'purple', weight: 1, opacity: 0.5, fillOpacity: 0.5 };
                            } else {
                                return { color: 'grey', weight: 1, opacity: 0.8, fillOpacity: 0.8 };
                            }
                        },
                        onEachFeature: function (feature, layer) {
                            if (feature.properties.res_type === "res" || feature.properties.classification_type === "res" || feature.properties.res_type === "non-res" || feature.properties.classification_type === "non-res") {
                                layer.on('mouseover', function (e) {
                                    var content = createPopupContent(feature.properties);
                                    showTemporaryPopup(e.latlng, content, feature);
                                });
                                layer.on('mouseout', function () {
                                    removeTemporaryPopup();
                                });
                                layer.on('click', function (e) {
                                    var content = createPopupContent(feature.properties);
                                    createDraggablePopup(e.latlng, content, feature, e);
                                    removeTemporaryPopup();
                                });
                            }
                        }
                    });
                    buildingLayers.push(layer);
                } catch (error) {
                    console.error('Error:', feature);
                }
            }); 
        }

        var tempPopup;

        function showTemporaryPopup(latlng, content, feature) {
            removeTemporaryPopup();  // Remove any existing temporary popup
            if (feature.properties.classification_type) {
                classificationType = feature.properties.classification_type;
            } else {
                classificationType = feature.properties.res_type;
            }
            var gradientColorEnd = classificationType === 'res' ? '#0000cd' : '#800080';
            var statsNameContent = classificationType === 'res' ? 'Residential' : 'Non-Residential';
            if (feature.properties.osm_type) {
                statsNameContent = feature.properties.osm_type.replaceAll("_", " ").replace(/([A-Z])/g, ' $1').trim();
            }
            var mapContainer = document.getElementById('map');
            tempPopup = document.createElement('div');
            tempPopup.className = 'custom-popup temporary-popup';
            tempPopup.innerHTML = '<div class="popup-content">' +
                '<div class="popup-header" style="background: linear-gradient(to right, #ccc, ' + gradientColorEnd + '); justify-content: center">' +
                '<span class="statsName">' + statsNameContent + ' Building' + '</span>' +
                '</div>' +
                '<div class="popup-body">' +
                content +
                '</div>' +
                '</div>';

            mapContainer.appendChild(tempPopup);

            // Position the temporary popup with an offset
            var point = map.latLngToContainerPoint(latlng);
            var offset = { x: 15, y: 15 }; // Offset values
            var left = point.x + offset.x;
            var top = point.y + offset.y;

            // Ensure the popup is within the visible map area and adjust position
            var mapRect = mapContainer.getBoundingClientRect();
            var popupRect = tempPopup.getBoundingClientRect();

            // Adjust horizontal position
            if (left + popupRect.width > mapRect.width) {
                left = point.x - popupRect.width - offset.x;
            }
            if (left < 0) {
                left = point.x + offset.x;
            }

            // Adjust vertical position
            if (top + popupRect.height > mapRect.height) {
                top = point.y - popupRect.height - offset.y;
            }
            if (top < 0) {
                top = point.y + offset.y;
            }

            tempPopup.style.left = left + 'px';
            tempPopup.style.top = top + 'px';
        }

        function removeTemporaryPopup() {
            if (tempPopup) {
                tempPopup.remove();
                tempPopup = null;
            }
        }
        function addSpaceBeforeCaps(input) {
            let result = input.replace(/([a-z])([A-Z])/g, '$1 $2');
            result = result.replace(/(\()([A-Z])/g, ' $1$2');

            return result;
        }

        function createPopupContent(properties) {
            // Tab 1: General
            var tab1Content = '<table>';
            tab1Content += '<tr><th>Coordinates</th><td>' + parseFloat(properties.latitude) + ', ' + parseFloat(properties.longitude) + '</td></tr>';
            tab1Content += '<tr><th>Footprint Source</th><td>' + (properties.footprint_source || properties.source) + '</td></tr>';
            if (properties.type_source) {
                const confidence = properties.confidence || (properties.ml_confidence * 100).toFixed(2);
                if ((properties.type_source == "OSMDerived") || (properties.type_source == "OSM Derived")) {
                    tab1Content += '<tr><th>Building Type Source</th><td>OSM Derived</td></tr>';
                } else {
                    tab1Content += '<tr><th>Building Type Source (Confidence)</th><td>' + properties.type_source + ' (' + confidence + ' %)</td></tr>';
                }
            } else {
                if (properties.source === "osm") {
                    tab1Content += '<tr><th>Building Type Source</th><td>OSM Derived</td></tr>';
                }
            }
            tab1Content += '<tr><th>GHS-SMOD</th><td>' + (addSpaceBeforeCaps(properties.ghsl_smod) || 'N/A') + '</td></tr>';
            //tab1Content += '<tr><th>Elevation</th><td>' + (properties.elevation || 'N/A') + ' m</td></tr>';
            tab1Content += '</table>';
        
            // Tab 2: Location
            var tab2Content = '<table>';
            tab2Content += '<tr><th>Height</th><td>' + properties.height + ' m (' + properties.floors + ' floors)</td></tr>';
            tab2Content += '<tr><th>Roof Area</th><td>' + parseFloat(properties.area_in_meters).toFixed(2) + ' m²</td></tr>';
            tab2Content += '<tr><th>Building Faces</th><td>' + properties.building_faces + '</td></tr>';
            tab2Content += '<tr><th>Perimeter</th><td>' + parseFloat(properties.perimeter_in_meters).toFixed(2) + ' m</td></tr>';
            tab2Content += '<tr><th>Gross Floor Area</th><td>' + parseFloat(properties.gfa_in_meters).toFixed(2) + ' m²</td></tr>';
            tab2Content += '</table>';
        
            // Tab 3: Electricity (Kenya Only)
            var tab3Content = '<table>';
            tab3Content += '<tr><th>Coordinates</th><td>' + parseFloat(properties.latitude) + ', ' + parseFloat(properties.longitude) + '</td></tr>';
            tab3Content += '<tr><th>Electricity Data Source</th><td>Open Energy Maps</td></tr>';
            if (typeof properties.elec_access_percent === "string") {
                tab3Content += '<tr><th>Electricity Access</th><td>N/A</td></tr>';
                tab3Content += '<tr><th>Electricity Consumption</th><td>N/A</td></tr>';
            } else {
                tab3Content += '<tr><th>Electricity Access</th><td>' + parseFloat(properties.elec_access_percent).toFixed(2) + ' %</td></tr>';
                tab3Content += '<tr><th>Electricity Consumption</th><td>' + parseFloat(properties.elec_consumption_kwh_month).toFixed(1) + ' kWh/month</td></tr>';
            }
            tab3Content += '</table>';
        
            // Tab 4: Solar Potential
            var tab4Content = '<table>';
            tab4Content += '<tr><th>Coordinates</th><td>' + parseFloat(properties.latitude) + ', ' + parseFloat(properties.longitude) + '</td></tr>';
            tab4Content += '<tr><th>Data Source</th><td>' + (properties.footprint_source || properties.source) + '</td></tr>';
            tab4Content += '<tr><th>Non-shaded Usable Roof Area</th><td>' + (properties.usable_roof_area || 'N/A') + '</td></tr>';
            tab4Content += '<tr><th>Optimal Tilt</th><td>' + (properties.optimal_tilt || 'N/A') + '</td></tr>';
            tab4Content += '<tr><th>Potential with Flat Panels</th><td>' + (properties.potential_flat_panels || 'N/A') + '</td></tr>';
            tab4Content += '<tr><th>Potential with Optimal Tilt</th><td>' + (properties.potential_optimal_tilt || 'N/A') + '</td></tr>';
            tab4Content += '</table>';
            
            displayTab1 = 'none';
            displayTab2 = 'none';
            displayTab3 = 'none';
            displayTab4 = 'none';
            switch(activePopupTab) {
                case "param1":
                    displayTab1 = 'block';
                    break;
                case "param2":
                    displayTab2 = 'block';
                    break;
                case "param3":
                    displayTab3 = 'block';
                    break;
                case "param4":
                    displayTab4 = 'block';
                    break;
            }

            return `
                <div class="popup-page" id="param1" style="display: ${displayTab1};">${tab1Content}</div>
                <div class="popup-page" id="param2" style="display: ${displayTab2};">${tab2Content}</div>
                <div class="popup-page" id="param3" style="display: ${displayTab3};">${tab3Content}</div>
                <div class="popup-page" id="param4" style="display: ${displayTab4};">${tab4Content}</div>
            `;
        }

        window.setViewOnFeature = function (coordinates) {
            var latlngs = coordinates[0].map(function (coord) {
                return [coord[1], coord[0]];
            });
            var highlightedLayer = L.polygon(latlngs, {
                color: 'red',
                weight: 3,
                opacity: 0.7,
                fillOpacity: 0.3
            }).addTo(map);

            setTimeout(function () {
                map.removeLayer(highlightedLayer);
            }, 5000);
        }

        // Define a custom Leaflet icon class
        var CustomIcon = L.Icon.extend({
            options: {
                shadowUrl: 'resources/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            }
        });

        var black = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-black.png' });
        var blue = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-blue.png' });
        var gold = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-gold.png' });
        var green = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-green.png' });
        var grey = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-grey.png' });
        var orange = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-orange.png' });
        var red = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-red.png' });
        var violet = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-violet.png' });
        var yellow = new CustomIcon({ iconUrl: 'resources/images/marker-icon-2x-yellow.png' });

        var markerIcons = [black, blue, gold, green, grey, orange, red, violet, yellow];
        var iconCounter = 0;

        function createDraggablePopup(latlng, content, feature, e) {
            var mapContainer = document.getElementById('map');
            var popupContainer = document.createElement('div');
            var coordinates = feature.geometry.coordinates;
            var classificationType;
        
            var latlngs = coordinates[0].map(function (coord) {
                return L.latLng(coord[1], coord[0]);
            });
            var center = L.latLngBounds(latlngs).getCenter();
        
            var icon = markerIcons[iconCounter];
            iconCounter = (iconCounter + 1) % markerIcons.length;
        
            var centerMarker = L.marker(center, { icon: icon }).addTo(map).bindPopup("I am a marker with a unique icon.");
        
            if (feature.properties.classification_type) {
                classificationType = feature.properties.classification_type;
            } else {
                classificationType = feature.properties.res_type;
            }
            var gradientColorEnd = classificationType === 'res' ? '#0000cd' : '#800080';
            var statsName = classificationType === 'res' ? 'Residential' : 'Non-Residential';
            if (feature.properties.osm_type) {
                statsName = feature.properties.osm_type.replaceAll("_", " ");
            }
        
            var tabContent = createPopupContent(feature.properties);
            tabButtonStyle1 = 'popup-tab';
            tabButtonStyle2 = 'popup-tab';
            tabButtonStyle3 = 'popup-tab';
            tabButtonStyle4 = 'popup-tab';
            switch(activePopupTab) {
                case "param1":
                    tabButtonStyle1 = 'popup-tab active';
                    break;
                case "param2":
                    tabButtonStyle2 = 'popup-tab active';
                    break;
                case "param3":
                    tabButtonStyle3 = 'popup-tab active';
                    break;
                case "param4":
                    tabButtonStyle4 = 'popup-tab active';
                    break;
            }
        
            popupContainer.className = 'custom-popup';
            popupContainer.innerHTML = `
                <div class="popup-content">
                    <div class="popup-header" style="background: linear-gradient(to right, #ccc, ${gradientColorEnd});">
                        <img src="${icon.options.iconUrl}" class="popup-icon" style="width: 20px; height: 30px; margin-top: 2px; margin-left: 5px;" />
                        <span class="statsName">${statsName} Building</span>
                        <span class="close-btn" onclick="window.closePopup(this)">
                            <i class='bx bx-x-circle' style='color:#ffffff'></i>
                        </span>
                    </div>
                    <div class="popup-tabs">
                        <button class="${tabButtonStyle1}" data-tab="param1">General</button>
                        <button class="${tabButtonStyle2}" data-tab="param2">Characteristics</button>
                        ${
                            country === "Kenya" 
                            ? '<button class="'+tabButtonStyle3+'" data-tab="param3">Electricity</button>' 
                            : ''
                        }
                        ${  false
                            ? '<button class="'+tabButtonStyle4+'" data-tab="param4">Solar Potential</button>'
                            : ''
                        }
                    </div>
                    <div class="popup-body">
                        ${tabContent}
                    </div>
                </div>
            `;
        
            mapContainer.appendChild(popupContainer);
        
            popupContainer.centerMarker = centerMarker;
        
            var point = map.latLngToContainerPoint(latlng);
            var offset = { x: 15, y: 15 };
            var left = point.x + offset.x;
            var top = point.y + offset.y;
        
            var mapRect = mapContainer.getBoundingClientRect();
            var popupRect = popupContainer.getBoundingClientRect();
        
            if (left + popupRect.width > mapRect.width) {
                left = point.x - popupRect.width - offset.x;
            }
            if (left < 0) {
                left = point.x + offset.x;
            }
        
            if (top + popupRect.height > mapRect.height) {
                top = point.y - popupRect.height - offset.y;
            }
            if (top < 0) {
                top = point.y + offset.y;
            }
        
            popupContainer.style.left = left + 'px';
            popupContainer.style.top = top + 'px';
        
            makePopupDraggable(popupContainer);

            const tabs = popupContainer.querySelectorAll('.popup-tab');
            const pages = popupContainer.querySelectorAll('.popup-page');
        
            tabs.forEach(tab => {
                tab.addEventListener('click', function () {
                    tabs.forEach(t => t.classList.remove('active'));
                    pages.forEach(p => p.style.display = 'none');
        
                    this.classList.add('active');
                    const targetPage = this.getAttribute('data-tab');
                    if (activePopupTab != targetPage) {
                        activePopupTab = targetPage
                        const allTabs = document.querySelectorAll('.popup-tab');
                        allTabs.forEach(mytab => {
                            if (mytab.getAttribute('data-tab') === activePopupTab) {
                                mytab.click();
                            }
                        })
                    }
                    popupContainer.querySelector(`#${targetPage}`).style.display = 'block';
                });
            });
        }
        
        window.closePopup = function (element) {
            var popup = element.closest('.custom-popup');
            if (popup) {
                if (popup.centerMarker) {
                    map.removeLayer(popup.centerMarker);
                }
                popup.remove();
            }
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
        };   

        function bringPopupToFront(popupElement) {
            var popups = document.querySelectorAll('.custom-popup');
            popups.forEach(function (popup) {
                if (popup === popupElement) {
                    popup.style.zIndex = 1000; // Bring the clicked popup to the front
                } else {
                    popup.style.zIndex = 999; // Send other popups behind
                }
            });
        }
        function makePopupDraggable(popupElement) {
            var header = popupElement.querySelector('.popup-header');
            header.style.cursor = 'move';

            header.onmousedown = function (e) {
                bringPopupToFront(popupElement); // Bring this popup to the front
                e.preventDefault();  // Prevent text selection
                // Disable map dragging
                map.dragging.disable();

                var posX = e.clientX, posY = e.clientY, elementX = popupElement.offsetLeft, elementY = popupElement.offsetTop;

                document.onmousemove = function (e) {
                    e.preventDefault();  // Prevent text selection
                    var dx = e.clientX - posX, dy = e.clientY - posY;
                    popupElement.style.left = elementX + dx + 'px';
                    popupElement.style.top = elementY + dy + 'px';
                };

                document.onmouseup = function () {
                    // Re-enable map dragging
                    document.onmousemove = document.onmouseup = null;
                };
            };

            // Prevent text selection
            header.onselectstart = function () {
                return false;
            };

            // Disable map events when hovering over the popup
            popupElement.onmouseenter = function () {
                map.dragging.disable();
                map.scrollWheelZoom.disable();
                map.doubleClickZoom.disable();
            };

            // Re-enable map events when not hovering over the popup
            popupElement.onmouseleave = function () {
                map.dragging.enable();
                map.scrollWheelZoom.enable();
                map.doubleClickZoom.enable();
            };

            // Allow interactions with the popup without affecting the map
            popupElement.onmousedown = function (e) {
                bringPopupToFront(popupElement); // Bring this popup to the front
                e.stopPropagation();
            };
        }


        var initialSelectionDone = false; // Flag to track if initial selection is done


        if (bounds != null) {
            buildingLayers.forEach(function (layer) {
                layer.selected = false;
            });
            var northEastArray = [], northWestArray = [], southEastArray = [], southWestArray = [];
    
    
            var offsetLng = (bounds.getEast() - bounds.getWest()) * 0.5;
            var offsetLat = (bounds.getNorth() - bounds.getSouth()) * 0.5;
    
            buildingLayers.forEach(function (layer) {
                var buildingCenter = layer.getBounds().getCenter();
    
                var isWest = buildingCenter.lng < center.lng + offsetLng;
                var isEast = buildingCenter.lng > center.lng - offsetLng;
                var isSouth = buildingCenter.lat < center.lat + offsetLat;
                var isNorth = buildingCenter.lat > center.lat - offsetLat;
                if (isWest && isNorth) northWestArray.push(layer);
                if (isEast && isNorth) northEastArray.push(layer);
                if (isWest && isSouth) southWestArray.push(layer);
                if (isEast && isSouth) southEastArray.push(layer);
            });
        }

        //more effective way for visualizing buildings on map, when moving on map, reduce percentage of buildings in zoom level
        function updateBuildingVisibility() {
            var currentZoom = map.getZoom();
            var mapBounds = map.getBounds();

            var layersToUpdate;
            if (!initialSelectionDone) {
                layersToUpdate = buildingLayers;
            } else {
                var currentCenter = map.getCenter();

                function filterLayers(layers) {
                    return layers.filter(function (layer) {
                        var layerBounds = layer.getBounds();
                        var isInViewport = layerBounds.intersects(mapBounds);
                        return isInViewport && (!layer.selected || currentZoom >= 16);
                    });
                }

                if (currentZoom >= 16) {
                    var quarterArray;
                    if (currentCenter.lng < center.lng) {
                        quarterArray = currentCenter.lat < center.lat ? southWestArray : northWestArray;
                    } else {
                        quarterArray = currentCenter.lat < center.lat ? southEastArray : northEastArray;
                    }
                    layersToUpdate = filterLayers(quarterArray);
                } else {
                    layersToUpdate = filterLayers(buildingLayers);
                }
            }
            layersToUpdate.forEach(function (layer) {
                if (currentZoom >= 16) {
                    // At zoom level 16, display all buildings
                    if (!map.hasLayer(layer)) {
                        map.addLayer(layer);
                    }
                } else {
                    // For other zoom levels
                    if (!initialSelectionDone) {
                        // If initial selection not done, select buildings based on the defined probability
                        layer.selected = buildingLayers.length > 800000 ? Math.random() < 0.002 : buildingLayers.length > 400000 ? Math.random() < 0.004 :
                            buildingLayers.length > 30000 ? Math.random() < 0.005 :
                                Math.random() < 0.2;
                    }

                    if (layer.selected) {
                        if (!map.hasLayer(layer)) {
                            map.addLayer(layer);
                        }
                    } else {
                        if (map.hasLayer(layer)) {
                            map.removeLayer(layer);
                        }
                    }
                }
            });

            // After first execution, set flag to true
            if (!initialSelectionDone) {
                initialSelectionDone = true;
            }
        }

        updateBuildingVisibility()
        let zoomIn = false;
        map.on('moveend', function () {
            if (map.getZoom() >= 16) {
                zoomIn = true;
                updateBuildingVisibility();
            }
            if (zoomIn && map.getZoom() <= 15) {
                zoomIn = false;
                updateBuildingVisibility();
            }
        });
    }
    

    function enableDrawing() {
        map.addControl(drawControl);
    }

    function enableGrayScreen() {
        $('.gray-screen').css({
            display: "flex"
        });
        Swal.close();
    }

    function closeGrayScreen() {
        $('.gray-screen').fadeOut();
    }

    function enableMapImage() {
        $('.map-image').css({
            display: "flex"
        });
    }

    function closeMapImageScreen() {
        $('.map-image').fadeOut();
    }

    //listeners for options in modal windows
    document.addEventListener('click', function (event) {
        if (event.target.closest('#drawAreaBox')) {
            enableGrayScreen();
            enableMapImage();
            disableFeatures()
            enableDrawing();
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('.gray-screen')) {
            closeGrayScreen();
            closeMapImageScreen();
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('.map-image')) {
            closeMapImageScreen();
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('#selectArea')) {
            openModalSelect()
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('#uploadShp')) {
            disableFeatures();
            openModalUpload();
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('#integrateBox')) {
            toggleHighlight("integrateBox")
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('#browseBox')) {
            toggleHighlight("browseBox")
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('#captureBox')) {
            toggleHighlight("captureBox")
        }
    });
    //highlight chosen option in second dialog of begin survey
    function toggleHighlight(boxId) {
        var box = document.getElementById(boxId);
        box.classList.toggle("highlighted");
        var wasHighlighted = box.classList.contains("highlighted");
        var span = box.querySelector(".pin-order-little");

        if (wasHighlighted) {
            if (span) {
                span.classList.add("visible");
            }
            if (boxId === "integrateBox") {
                beginSurvey.integrate = true;
            } else if (boxId === "browseBox") {
                beginSurvey.browse = true;
            } else {
                beginSurvey.capture = true;
            }
        } else {
            if (span) {
                span.classList.remove("visible");
            }
            if (boxId === "integrateBox") {
                beginSurvey.integrate = false;
            } else if (boxId === "browseBox") {
                beginSurvey.browse = false;
            } else {
                beginSurvey.capture = false;
            }
        }
    }

    var editableLayer = null;
    //creating rectangle or polygon
    var submitButton = document.getElementById('submitButton');
    function tooBigArea(squareArea) {
        if (squareArea > 1500) {
            Swal.fire({
                html: 'The area is too big and will take a long time to count and may not load at all. Please use admin level selection or download entire data set.',
                showConfirmButton: true,
                confirmButtonText: 'Select County',
                showCancelButton: true,
                cancelButtonText: 'Entire Data Set',
                allowOutsideClick: false,
                allowEscapeKey: false,
                icon: "error",
            }).then((result) => {
                if (result.isConfirmed) {
                    disableFeatures()
                    submitButton.style.display = 'none';
                    drawControl.remove(map);
                    openModalSelect();
                    map.on('mousemove', function (e) {
                        tooltip.setLatLng(e.latlng);
                        map.openTooltip(tooltip);
                    });
                    map.on('click', function () {
                        openModal();
                    });
                    if (editableLayer) {
                        map.removeLayer(editableLayer);
                    }
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    window.location.href = 'share.html';
                }
            });
        }
    }
    //function for no display context after right click on map when moving
    map.on('contextmenu', function (event) {
        event.originalEvent.preventDefault();
        return false;
    });
    //map events configruation for creating and deleting
    map.on(L.Draw.Event.CREATED, function (event) {
        if (editableLayer) {
            map.removeLayer(editableLayer);
        }
        var layer = event.layer;
        editableLayer = layer;
        let geojson = editableLayer.toGeoJSON();
        let polygon = turf.polygon(geojson.geometry.coordinates);
        let square_area = turf.area(polygon) / 1000000;
        let centroid = turf.centroid(turf.polygon(geojson.geometry.coordinates));
        findCountryByPolygon(centroid)
        tooBigArea(square_area)
        drawnItems.addLayer(layer);
        //submitButton.style.display = 'block';
        polygonCoordinates = editableLayer.getBounds();
        latLngs = editableLayer.getLatLngs();
        var editToolbar = new L.EditToolbar.Edit(map, {
            featureGroup: drawnItems, selectedPathOptions: {
                maintainColor: true,
            },
        });
        layer.on('edit', function (event) {
            polygonCoordinates = editableLayer.getBounds();
            latLngs = editableLayer.getLatLngs();
        });
    });
    map.on(L.Draw.Event.DELETED, function () {
        editableLayer = null;
        submitButton.style.display = 'none';
        map.on('mousemove', function (e) {
            tooltip.setLatLng(e.latlng);
            map.openTooltip(tooltip);
        });
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('#uploadShapeFile')) {
            handleFileSelect()
                .then(polygons => {
                    if (editableLayer) {
                        map.removeLayer(editableLayer);
                    }
                    map.addControl(drawControl);

                    if (polygons[0].type == "MultiPolygon") {
                        renderMultiPolygons(polygons, L, map, onEachFeature);
                    } else {
                        renderPolygon(polygons, L, map, onEachFeature);
                    }

                    //submitButton.style.display = 'block';
                    Swal.close();
                })
                .catch(error => {
                    drawControl.remove(map);
                });
            this.value = '';

            function onEachFeature(feature, layer) {
                drawnItems.addLayer(layer);
            }
        }

        function renderMultiPolygons (polygons, L, map, onEachFeature) {
            for (var i = 0; i < polygons.length; i++) {
                for (var j = 0; j < polygons[i].coordinates.length; j++) {
                    for (var k = 0; k < polygons[i].coordinates[j].length; k++) {
                        let coordinates = polygons[i].coordinates[j][k];
                        let polygon = turf.polygon([coordinates]);
                        editableLayer = L.geoJSON(polygon, {
                            onEachFeature: onEachFeature,
                            style: {
                                color: 'red', weight: 2, opacity: 0.6, fillOpacity: 0.1
                            },
                        }).addTo(map);
                        let geojson = editableLayer.toGeoJSON();
                        let poly = turf.polygon(geojson.features[0].geometry.coordinates);
                        let square_area = turf.area(poly) / 1000000;
                        let centroid = turf.centroid(turf.polygon(geojson.features[0].geometry.coordinates));
                        findCountryByPolygon(centroid)
                        tooBigArea(square_area)
                        polygonCoordinates.push(editableLayer.getBounds());
                        editableLayer.eachLayer(function (layer) {
                            latLngs[j] = layer.getLatLngs();
                            layer.on('edit', function (event) {
                                let editedLayer = event.target;
                                polygonCoordinates[j] = editedLayer.getBounds();
                                latLngs[j] = editedLayer.getLatLngs()
                            });
                        });
                        var southWest = polygonCoordinates[j].getSouthWest();
                        var northEast = polygonCoordinates[j].getNorthEast();
                        var bounds = L.latLngBounds(southWest, northEast);
                        map.fitBounds(bounds);
                    }
                }
            }
        }
        
        function renderPolygon(polygons, L, map, onEachFeature) {
            let coordinates = polygons[0].coordinates[0];
            let polygon = turf.polygon([coordinates]);
            editableLayer = L.geoJSON(polygon, {
                onEachFeature: onEachFeature,
                style: {
                    color: 'red', weight: 2, opacity: 0.6, fillOpacity: 0.1
                },
            }).addTo(map);
            let geojson = editableLayer.toGeoJSON();
            let poly = turf.polygon(geojson.features[0].geometry.coordinates);
            let square_area = turf.area(poly) / 1000000;
            let centroid = turf.centroid(turf.polygon(geojson.features[0].geometry.coordinates));
            findCountryByPolygon(centroid)
            tooBigArea(square_area)
            polygonCoordinates = editableLayer.getBounds();
            editableLayer.eachLayer(function (layer) {
                latLngs = layer.getLatLngs();
                layer.on('edit', function (event) {
                    let editedLayer = event.target;
                    polygonCoordinates = editedLayer.getBounds();
                    latLngs = editedLayer.getLatLngs()
                });
            });
            var southWest = polygonCoordinates.getSouthWest();
            var northEast = polygonCoordinates.getNorthEast();
            var bounds = L.latLngBounds(southWest, northEast);
            map.fitBounds(bounds);
        }

    });
    //function for uploading shapefiles
    async function handleFileSelect() {
        const files = Array.from(selectedFiles);
        if (files.length < 4) {
            Swal.fire({
                html: 'Please try again and select 4 files with extension .shp, .shx, .prj and .dbf !',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false,
                icon: "error"
            }).then(() => {
                enableFeatures()
            });
            return;
        }

        const sortedFiles = {
            shp: files.find(file => file.name.endsWith('.shp')),
            shx: files.find(file => file.name.endsWith('.shx')),
            dbf: files.find(file => file.name.endsWith('.dbf')),
            prj: files.find(file => file.name.endsWith('.prj')),
        };
        if (!sortedFiles.shp || !sortedFiles.shx || !sortedFiles.dbf || !sortedFiles.prj) {
            Swal.fire({
                title: 'Please try again and select 3 files with extension .shp, .shx, .prj and .dbf !',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false,
                icon: "error"
            }).then(() => {
                enableFeatures()
            });
            return;
        }


        try {
            const buffers = await Promise.all(
                Object.values(sortedFiles).map(file => file.arrayBuffer())
            );

            const shpBuffer = buffers[0];
            const dbfBuffer = buffers[1];
            const prjBuffer = buffers[3];
            const prjString = new TextDecoder().decode(prjBuffer);
            const sourceProjection = proj4.Proj(prjString);

            const geojsonData = await shp.combine([
                shp.parseShp(shpBuffer, prjString),
                shp.parseDbf(dbfBuffer)
            ]);

            const polygons = [];

            const targetProjection = proj4.Proj('EPSG:4326');

            geojsonData.features.forEach(feature => {
                if (feature.geometry.type === 'Polygon' || feature.geometry.type === "MultiPolygon") {
                    feature.geometry.coordinates = feature.geometry.coordinates.map(polygon =>
                        polygon.map(coord => {
                            if (Array.isArray(coord[0])) {
                                const multipolygonArray = [];
                                for (let i = 0; i < coord.length; i++) {
                                    multipolygonArray.push(proj4(sourceProjection, targetProjection, coord[i]));
                                }
                                return multipolygonArray;
                            } else {
                                return proj4(sourceProjection, targetProjection, coord);
                            }
                        })
                    );
                    polygons.push(feature.geometry);
                }
            });
            return polygons;
        } catch (error) {
            console.error('Error processing the shapefiles:', error);
        }
    }

});
//share page
$("#submitFeedbackButton").on("click", function (e) {
    e.preventDefault();
    var selectedTopic = $('#selectTopic option:selected').text();
    var feedbackMessage = $('#feedbackMessage').val();
    var date = (new Date()).toString().split(' ').splice(1, 4).join(' ');

    beginFeedback.topic = selectedTopic;
    beginFeedback.message = feedbackMessage;
    beginFeedback.date = date;

    if (feedbackMessage) {
        $.ajax({
            type: 'POST',
            url: `${apiUrl}/feedback`,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({
                beginFeedback
            }),
            dataType: 'json',
        }).done(function (result) {
        }).fail(function () {
            console.log("failed")
        });

        Swal.fire({
            icon: "success",
            title: "Thank you!",
            text: "Your feedback has been submitted",
        });
        $('#feedbackMessage').val('')
    }
    else {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please fill out the message box.",
        });
    }
});

//survey

$("#submitEvalButton").on("click", function (e) {
    e.preventDefault();

    var firstName = $('#txtFirstName').val();
    var lastName = $('#txtLastName').val();
    var email = $('#txtEmail').val();
    var jobTitle = $('#txtJobTitle').val();
    var org = $('#txtOrganization').val();
    var purpose = [];
    var modelling = [];
    var rateNavigation;
    var rateSatisfaction;

    var date = (new Date()).toString().split(' ').splice(1, 4).join(' ');

    beginEval.firstName = firstName;
    beginEval.lastName = lastName;
    beginEval.email = email;
    beginEval.jobTitle = jobTitle;
    beginEval.org = org;
    beginEval.date = date;

    beginEval.purpose = purpose;




    if (firstName) {
        $.ajax({
            type: 'POST',
            url: `${apiUrl}/eval`,
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({
                beginEval
            }),
            dataType: 'json',
        }).done(function (result) {
        }).fail(function () {
            console.log("failed")
        });

        Swal.fire({
            icon: "success",
            title: "Thank you!",
            text: "Your feedback has been submitted",
        });
        $('#feedbackMessage').val('')
        window.location.href = 'map.html';
    }
    else {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please fill out the message box.",
        });
    }


});
function setLoadingText(text) {
    $('#loading-text').html(text)
}