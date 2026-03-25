export interface WeatherData {
  temperature: number;     // °C à l'heure du départ
  windspeed: number;       // km/h
  weathercode: number;     // WMO weather code
}

export function weatherCodeToLabel(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Ciel dégagé', emoji: '☀️' };
  if (code <= 2) return { label: 'Peu nuageux', emoji: '🌤️' };
  if (code === 3) return { label: 'Couvert', emoji: '☁️' };
  if (code <= 49) return { label: 'Brouillard', emoji: '🌫️' };
  if (code <= 59) return { label: 'Bruine', emoji: '🌦️' };
  if (code <= 69) return { label: 'Pluie', emoji: '🌧️' };
  if (code <= 79) return { label: 'Neige', emoji: '❄️' };
  if (code <= 82) return { label: 'Averses', emoji: '🌦️' };
  if (code <= 86) return { label: 'Neige', emoji: '🌨️' };
  if (code <= 99) return { label: 'Orage', emoji: '⛈️' };
  return { label: 'Inconnu', emoji: '🌡️' };
}

/**
 * Récupère la météo historique via OpenMeteo (gratuit, sans clé API)
 * @param lat latitude du point de départ
 * @param lon longitude du point de départ
 * @param date date ISO YYYY-MM-DD
 * @param hour heure de départ (0-23)
 */
export async function fetchWeather(
  lat: number,
  lon: number,
  date: string,
  hour: number = 12,
): Promise<WeatherData> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${date}&end_date=${date}` +
    `&hourly=temperature_2m,weathercode,windspeed_10m` +
    `&timezone=Europe%2FBrussels`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('OpenMeteo error');
  const json = await res.json();

  const idx = Math.min(hour, json.hourly.time.length - 1);
  return {
    temperature: Math.round(json.hourly.temperature_2m[idx]),
    windspeed: Math.round(json.hourly.windspeed_10m[idx]),
    weathercode: json.hourly.weathercode[idx],
  };
}
