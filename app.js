const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const validationMsg = document.getElementById("validationMsg");
const errorBanner = document.getElementById("errorBanner");
const forecastRow = document.getElementById("forecastRow");

let currentUnit = "C";
let savedWeather = null;

function showSkeleton() {

    document.querySelectorAll(
        "#cityName,#temp,#desc,#humidity,#wind,#time"
    ).forEach(item => {
        item.classList.add("skeleton");
        item.textContent = "";
    });

    forecastRow.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        forecastRow.innerHTML += `
            <div class="day-card skeleton"
                 style="height:120px;">
            </div>
        `;
    }
}

function removeSkeleton() {
    document.querySelectorAll(".skeleton")
        .forEach(item => {
            item.classList.remove("skeleton");
        });
}

const weatherCodes = {
    0: ["☀️", "Clear Sky"],
    1: ["🌤", "Mainly Clear"],
    2: ["⛅", "Partly Cloudy"],
    3: ["☁️", "Overcast"],
    45: ["🌫", "Fog"],
    61: ["🌧", "Rain"],
    71: ["❄️", "Snow"],
    95: ["⛈", "Thunderstorm"]
};

