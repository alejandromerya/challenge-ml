import { Coordinates } from './Coordinate';

interface DayWeatherPlanet {
  name: string;
  coordinates: Coordinates;
}

export interface MaxRainIntensityDays {
  days: number[];
  perimeter: number;
}

export interface Periods {
  drought: number;
  rainy: number;
  optimal: number;
  unknown: number;
}

export type Weather = 'optimal' | 'drought' | 'rainy' | 'unknown';

export interface DayWeather {
  day: number;
  planets: DayWeatherPlanet[];
  weather: Weather;
}
