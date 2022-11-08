import { DayWeather } from '../../core/entities';
import { IPlanetWeatherRepository } from '../../core/domain/ports/repositories/IPlanetWeatherRepository';
import db from 'aws-sdk/clients/dynamodb';

export class PlanetWeatherRepository implements IPlanetWeatherRepository {
  constructor(private ddb: db.DocumentClient) {}

  async createPlanetWeatherDay(dayData: DayWeather): Promise<void> {
    const TableName = process.env.DYNAMO_DB_NAME;

    if (!TableName) {
      throw new Error('Missing DynamoDb name not found');
    }

    const params = {
      TableName: TableName,
      Item: {
        day: dayData.day,
        planets: dayData.planets,
        weather: dayData.weather
      }
    };

    await this.ddb.put(params).promise();
  }
}
