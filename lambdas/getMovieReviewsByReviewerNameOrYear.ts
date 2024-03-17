import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddbDocClient = createDDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log('Event: ', event);

    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const reviewerNameOrYear = parameters?.reviewerName;

    if (!movieId || !reviewerNameOrYear) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ Message: 'MovieId and reviewerName or year are required' }),
      };
    }

    const isYear = (str: string) => /^\d{4}$/.test(str);
    const filterKey = isYear(reviewerNameOrYear) ? 'reviewDate' : 'reviewerName';
    const filterExpression = isYear(reviewerNameOrYear) ? 'begins_with(reviewDate, :f)' :'contains(reviewerName, :f)';
    const commandOutput = await ddbDocClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'movieId = :m',
        FilterExpression: filterExpression,
        ExpressionAttributeValues: {
          ':m': movieId,
          ':f': reviewerNameOrYear,
        },
      }),
    );

    if (!commandOutput.Items || commandOutput.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ Message: 'No reviews found for the given movieId and filter' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ data: commandOutput.Items }),
    };
  } catch (error: any) {
    console.error(error);

    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDBDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const translateConfig = {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
