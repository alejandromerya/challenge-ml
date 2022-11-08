import db from 'aws-sdk/clients/dynamodb';
import { PlanetWeatherRepository } from './adapter/planetWeatherRepository';

const ddb = new db.DocumentClient();

export const planetWeatherRepo = new PlanetWeatherRepository(ddb);
