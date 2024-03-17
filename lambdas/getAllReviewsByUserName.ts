import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { apiResponse } from './utils'; 

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log('Event:', event);

    const reviewerName = event.pathParameters?.reviewerName;
    if (!reviewerName) {
      return apiResponse(400, { message: 'Reviewer name is required in the path parameters.' });
    }

    const scanResult = await ddbDocClient.send(new ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: 'contains(reviewerName, :reviewerName)',
      ExpressionAttributeValues: {
        ':reviewerName': reviewerName,
      },
    }));

    if (scanResult.Items?.length === 0) {
      return apiResponse(404, { message: 'No reviews found for the given reviewer name.' });
    }

    return apiResponse(200, { items: scanResult.Items });
  } catch (error) {
    console.error(error);
    return apiResponse(500, { error: 'An internal server error occurred.' });
  }
};
