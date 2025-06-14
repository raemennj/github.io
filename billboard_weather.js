window.addEventListener('DOMContentLoaded', function() {
    const billboards = document.querySelectorAll('.billboard-text');

    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto';

    fetch(url)
        .then(r => r.json())
        .then(data => {
            const code = data.daily.weathercode[0];
            const tMin = Math.round(data.daily.temperature_2m_min[0]);
            const tMax = Math.round(data.daily.temperature_2m_max[0]);
            const desc = codeToDescription(code);
            billboards.forEach(el => {
                el.textContent = `${desc}, ${tMin}\u00B0C - ${tMax}\u00B0C`;
            });
        })
        .catch(err => {
            console.error(err);
            billboards.forEach(el => {
                el.textContent = 'Weather unavailable';
            });
        });

    function codeToDescription(code) {
        const map = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Rime fog',
            51: 'Light drizzle',
            53: 'Drizzle',
            55: 'Dense drizzle',
            56: 'Freezing drizzle',
            57: 'Freezing drizzle',
            61: 'Slight rain',
            63: 'Rain',
            65: 'Heavy rain',
            71: 'Snow fall',
            80: 'Rain showers',
            95: 'Thunderstorm'
        };
        return map[code] || 'Weather';
    }
});
