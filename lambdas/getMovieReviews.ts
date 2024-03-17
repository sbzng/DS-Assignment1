import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,QueryCommand} from '@aws-sdk/lib-dynamodb';
import Ajv from 'ajv';
import schema from '../shared/types.schema.json';

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(schema.definitions['MovieReviewsQueryParams'] || {});

const ddbDocClient = createDdbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log('Event: ', event);

    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId
      ? parseInt(parameters.movieId)
      : undefined;
    const queryParams = event?.queryStringParameters;

    if (!movieId) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({Message: 'MovieId is required'}),
      };
    }

    if (queryParams && !isValidQueryParams(queryParams)) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({Message: 'Invalid query parameters'}),
      };
    }

    const commandOutput = await ddbDocClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'movieId = :m',
        ExpressionAttributeValues: {
          ':m': movieId,
        },
      }),
    );

    if (!commandOutput.Items || commandOutput.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({Message: 'No reviews found for the given movieId'}),
      };
    }

    let filteredItems = commandOutput.Items;
    if (queryParams && queryParams.minRating) {
      const minRating = parseInt(queryParams.minRating);
      filteredItems = commandOutput.Items.filter(item => item.rating >= minRating);
    }

    return {
      statusCode: 200,
      headers: {
          'content-type': 'application/json',
      },
      body: JSON.stringify({data: filteredItems}),
    };
  } catch (error: any) {
    console.error(error);

    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({error: 'Internal Server Error'}),
    };
  }
};

function createDdbDocClient() {
  const ddbClient = new DynamoDBClient({region: process.env.REGION});

  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };

  const unmarshallOptions = {
    wrapNumbers: false,
  };

  const translateConfig = {marshallOptions, unmarshallOptions};

  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
