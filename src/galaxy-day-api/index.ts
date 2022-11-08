import * as AWS from 'aws-sdk';

const ddb = new AWS.DynamoDB();

async function getDayWeather(day: number): Promise<string> {
  const dynamoTable = process.env.DYNAMO_DB_NAME || null;

  if (!dynamoTable) {
    throw new Error('Missing Dynamo table env variable');
  }

  const params = {
    Key: {
      day: {
        N: day.toString()
      }
    },
    TableName: dynamoTable
  };

  const dayInfo = await ddb.getItem(params).promise();

  if (!dayInfo || !dayInfo.Item) {
    throw new Error('Error on query');
  }

  const weather = dayInfo.Item.weather.S;

  if (!weather) {
    throw new Error('Property missing in object');
  }

  return weather;
}

export async function handler(event: {
  queryStringParameters: { day: number };
}): Promise<{ day: number; weather: string } | string> {
  if (
    !event ||
    !event.queryStringParameters ||
    !event.queryStringParameters.day
  ) {
    throw new Error('Missing day variable on event');
  }

  const day = event.queryStringParameters.day;

  try {
    const weather = await getDayWeather(+day);

    return {
      day,
      weather
    };
  } catch (error: any) {
    console.log(error);

    return 'Record not found';
  }
}
