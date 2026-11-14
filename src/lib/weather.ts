// Nordwalde, NRW - Koordinaten für die Wetterabfrage.
const NORDWALDE_LAT = 52.03;
const NORDWALDE_LON = 7.38;

// WMO-Wettercodes (Open-Meteo) grob ins Deutsche übersetzt.
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Klar",
  1: "Überwiegend klar",
  2: "Teilweise bewölkt",
  3: "Bedeckt",
  45: "Nebel",
  48: "Reifnebel",
  51: "Leichter Nieselregen",
  53: "Nieselregen",
  55: "Starker Nieselregen",
  56: "Gefrierender Nieselregen",
  57: "Starker gefrierender Nieselregen",
  61: "Leichter Regen",
  63: "Regen",
  65: "Starker Regen",
  66: "Gefrierender Regen",
  67: "Starker gefrierender Regen",
  71: "Leichter Schneefall",
  73: "Schneefall",
  75: "Starker Schneefall",
  77: "Schneegriesel",
  80: "Leichte Regenschauer",
  81: "Regenschauer",
  82: "Starke Regenschauer",
  85: "Leichte Schneeschauer",
  86: "Starke Schneeschauer",
  95: "Gewitter",
  96: "Gewitter mit Hagel",
  99: "Starkes Gewitter mit Hagel",
};

export type WeatherNow = {
  temperatureC: number;
  description: string;
};

/** Open-Meteo braucht keinen API-Key und hat ein grosszügiges, kostenloses Limit. */
export async function fetchNordwaldeWeather(): Promise<WeatherNow | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(NORDWALDE_LAT),
      longitude: String(NORDWALDE_LON),
      current_weather: "true",
      timezone: "Europe/Berlin",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      current_weather?: { temperature: number; weathercode: number };
    };
    if (!data.current_weather) return null;

    return {
      temperatureC: data.current_weather.temperature,
      description: WEATHER_CODE_LABELS[data.current_weather.weathercode] ?? "Unbekannt",
    };
  } catch {
    return null;
  }
}
