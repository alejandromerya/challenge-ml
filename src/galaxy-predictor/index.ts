import { approveAndExecuteWarehouseStockControlPointUseCase } from './core';
import { planets } from './planets';
import * as dotenv from 'dotenv';
dotenv.config();

export async function handler(): Promise<void> {
  const days = +(process.env.DAYS_TO_PREDICT || '');

  if (!days) {
    throw new Error('Missing DAYS_TO_PREDICT env variable');
  }

  try {
    const response =
      await approveAndExecuteWarehouseStockControlPointUseCase.execute({
        days,
        sunCoordinates: { x: 0, y: 0 },
        planets
      });

    console.log(response);
  } catch (error: any) {
    console.log('Error:', JSON.stringify(error));
    throw new Error(error.message || 'Internal error');
  }
}
