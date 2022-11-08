import { DayWeather } from '../../../entities/DayWeather';

export interface IPlanetWeatherRepository {
  createPlanetWeatherDay(dayData: DayWeather): Promise<void>;
}
