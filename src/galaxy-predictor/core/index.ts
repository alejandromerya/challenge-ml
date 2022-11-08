import { planetWeatherRepo } from '../infrastructure';
import PredictGalaxyDaysWeatherUseCase from './predictGalaxyDaysWeatherUseCase';

export * from './domain';
export * from './entities';

export const approveAndExecuteWarehouseStockControlPointUseCase =
  new PredictGalaxyDaysWeatherUseCase(planetWeatherRepo);
