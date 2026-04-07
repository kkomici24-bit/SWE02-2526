const RAPID_API_KEY_STORAGE_KEY = 'rapidApiKey';
const WEATHER_API_HOST = 'community-open-weather-map.p.rapidapi.com';

function createStatusAlert(type, message) {
    return `
        <div class="alert alert-${type}" role="alert">
            ${message}
        </div>
    `;
}

function renderWeather(data) {
    const weatherTitle = data.weather?.[0]?.main || 'Unknown';
    const weatherDescription = data.weather?.[0]?.description || 'No description available';
    const temperature = data.main?.temp ?? 'N/A';
    const feelsLike = data.main?.feels_like ?? 'N/A';
    const humidity = data.main?.humidity ?? 'N/A';
    const windSpeed = data.wind?.speed ?? 'N/A';

    $('#results').html(`
        <div class="card">
            <div class="card-body">
                <h4 class="card-title mb-3">${data.name}, ${data.sys?.country || ''}</h4>
                <p class="mb-2"><strong>Condition:</strong> ${weatherTitle} (${weatherDescription})</p>
                <p class="mb-2"><strong>Temperature:</strong> ${temperature} °C</p>
                <p class="mb-2"><strong>Feels Like:</strong> ${feelsLike} °C</p>
                <p class="mb-2"><strong>Humidity:</strong> ${humidity}%</p>
                <p class="mb-0"><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
            </div>
        </div>
    `);
}

function getWeather(event) {
    event.preventDefault();

    const apiKey = $('#rapidApiKey').val().trim();
    const cityName = $('#cityName').val().trim();

    if (!apiKey || !cityName) {
        $('#statusMessage').html(createStatusAlert('warning', 'Please enter both a RapidAPI key and a city name.'));
        $('#results').empty();
        return;
    }

    localStorage.setItem(RAPID_API_KEY_STORAGE_KEY, apiKey);

    $('#statusMessage').html(createStatusAlert('secondary', 'Loading weather...'));
    $('#results').empty();

    $.ajax({
        async: true,
        crossDomain: true,
        url: `https://${WEATHER_API_HOST}/weather?q=${encodeURIComponent(cityName)}&units=metric`,
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': WEATHER_API_HOST
        }
    }).done(function(response) {
        $('#statusMessage').html(createStatusAlert('success', `Current weather loaded for ${response.name}.`));
        renderWeather(response);
    }).fail(function(xhr) {
        const message = xhr.responseJSON?.message || 'The request failed. Double-check your RapidAPI key and city name, then try again.';

        $('#statusMessage').html(createStatusAlert('danger', message));
        $('#results').empty();
    });
}

function clearSavedKey() {
    localStorage.removeItem(RAPID_API_KEY_STORAGE_KEY);
    $('#rapidApiKey').val('');
    $('#statusMessage').html(createStatusAlert('info', 'Saved RapidAPI key removed from this browser.'));
    $('#results').empty();
}

$(document).ready(function() {
    const savedKey = localStorage.getItem(RAPID_API_KEY_STORAGE_KEY) || '';

    $('#rapidApiKey').val(savedKey);
    $('#weatherForm').on('submit', getWeather);
    $('#clearKeyBtn').on('click', clearSavedKey);
});
