import {
  Coordinates,
  MaxRainIntensityDays,
  Periods,
  Planet
} from '../../../entities';

export type PredictGalaxyDaysWeatherUseCaseInput = {
  days: number;
  sunCoordinates: Coordinates;
  planets: Planet[];
};

export type PredictGalaxyDaysWeatherUseCaseOutput = {
  periods: Periods;
  maxRainyIntensityDays: MaxRainIntensityDays;
};
