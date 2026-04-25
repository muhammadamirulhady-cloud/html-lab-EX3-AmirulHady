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

async function searchWeather() {

    const city = cityInput.value.trim();

    if (city.length < 2) {
        validationMsg.textContent =
            "Please enter at least 2 characters.";
        return;
    }

    validationMsg.textContent = "";
    clearError();
    showSkeleton();

    try {

        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

        const geoResponse =
            await fetchWithTimeout(geoURL);

        if (!geoResponse.ok) {
            throw new Error(
                "HTTP Error " + geoResponse.status
            );
        }

        const geoData =
            await geoResponse.json();

        if (
            !geoData.results ||
            geoData.results.length === 0
        ) {
            showError("City not found.");
            return;
        }

        const place = geoData.results[0];

        const latitude = place.latitude;
        const longitude = place.longitude;
        const timezone = place.timezone;

        const weatherURL =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

        const weatherResponse =
            await fetchWithTimeout(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error(
                "HTTP Error " + weatherResponse.status
            );
        }

        const weatherData =
            await weatherResponse.json();

        savedWeather = weatherData;

        displayWeather(place.name, weatherData);
        getLocalTime(timezone);
        saveHistory(place.name);

    } catch (error) {

        if (error.name === "AbortError") {
            showError(
                "Request timeout after 10 seconds."
            );
        } else {
            showError(error.message);
        }

    }
}

function displayWeather(city, data) {

    removeSkeleton();

    const current = data.current_weather;

    const code =
        weatherCodes[current.weathercode] ||
        ["❓", "Unknown"];

    document.getElementById("cityName")
        .textContent = city;

    document.getElementById("temp")
        .textContent =
        `Temperature: ${convertTemp(current.temperature)}°${currentUnit}`;

    document.getElementById("desc")
        .textContent =
        `${code[0]} ${code[1]}`;

    document.getElementById("humidity")
        .textContent =
        "Humidity: Available in hourly data";

    document.getElementById("wind")
        .textContent =
        `Wind Speed: ${current.windspeed} km/h`;

    forecastRow.innerHTML = "";

    for (let i = 0; i < 7; i++) {

        const day =
            new Date(data.daily.time[i])
            .toLocaleDateString("en-US", {
                weekday: "short"
            });

        const max =
            convertTemp(
                data.daily.temperature_2m_max[i]
            );

        const min =
            convertTemp(
                data.daily.temperature_2m_min[i]
            );

        const forecastCode =
            weatherCodes[
                data.daily.weathercode[i]
            ] || ["❓", "Unknown"];

        forecastRow.innerHTML += `
            <div class="day-card">
                <h4>${day}</h4>
                <p>${forecastCode[0]}</p>
                <p>${max}° / ${min}°</p>
            </div>
        `;
    }
}

function getLocalTime(timezone) {

    $.getJSON(
        `https://worldtimeapi.org/api/timezone/${timezone}`
    )

    /* Success */
    .done(function (data) {

        const localTime =
            new Date(data.datetime)
            .toLocaleTimeString();

        $("#time").text(
            "Local Time: " + localTime
        );

    })

    /* Fail */
    .fail(function () {

        const browserTime =
            new Date()
            .toLocaleTimeString();

        $("#time").text(
            "Local Time: " + browserTime
        );

    })

    /* Always */
    .always(function () {

        console.log(
            "Time request completed at:",
            new Date()
        );

    });
}

function showError(message) {

    errorBanner.innerHTML = `
        <div class="error">
            ${message}
            <button onclick="searchWeather()">
                Retry
            </button>
        </div>
    `;
}

function clearError() {
    errorBanner.innerHTML = "";
}

async function fetchWithTimeout(url) {

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(() => {
            controller.abort();
        }, 10000);

    const response =
        await fetch(url, {
            signal: controller.signal
        });

    clearTimeout(timeoutId);

    return response;
}

function debounce(func, delay) {

    let timer;

    return function (...args) {

        clearTimeout(timer);

        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);

    };
}

function saveHistory(city) {

    let history =
        JSON.parse(
            localStorage.getItem(
                "weatherHistory"
            )
        ) || [];

    history =
        history.filter(
            item => item !== city
        );

    history.unshift(city);

    if (history.length > 5) {
        history.pop();
    }

    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(history)
    );

    renderHistory();
}

function renderHistory() {

    const history =
        JSON.parse(
            localStorage.getItem(
                "weatherHistory"
            )
        ) || [];

    const container =
        document.getElementById(
            "history"
        );

    container.innerHTML =
        history.map(city =>
            `<span class="chip"
                onclick="loadCity('${city}')">
                ${city}
            </span>`
        ).join("");
}

function loadCity(city) {
    cityInput.value = city;
    searchWeather();
}

function convertTemp(temp) {

    if (currentUnit === "C") {
        return Math.round(temp);
    }

    return Math.round(
        (temp * 9 / 5) + 32
    );
}

document.getElementById("toggleUnit")
.addEventListener("click", function () {

    currentUnit =
        currentUnit === "C"
        ? "F"
        : "C";

    this.textContent =
        currentUnit === "C"
        ? "Switch °F"
        : "Switch °C";

    if (savedWeather) {

        const city =
            document.getElementById(
                "cityName"
            ).textContent;

        displayWeather(
            city,
            savedWeather
        );
    }

});

/* Search Button */
searchBtn.addEventListener(
    "click",
    searchWeather
);

/* Debounce Input */
cityInput.addEventListener(
    "input",
    debounce(function () {

        if (
            cityInput.value.trim().length >= 2
        ) {
            searchWeather();
        }

    }, 500)
);

/* Load Search History */
renderHistory();