import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { apiResponse } from './utils';

const createDDbDocClient = () => {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient);
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const ddbDocClient = createDDbDocClient();
  const translate = new AWS.Translate();
  
  const movieId = event.pathParameters?.movieId;
  const reviewerName = event.pathParameters?.reviewerName;
  const language = event.queryStringParameters?.language;
  
  if (!movieId || !reviewerName || !language) {
    return apiResponse(400, { message: 'Missing required parameters.' });
  }
  
  const getCommandOutput = await ddbDocClient.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: {
      MovieId: movieId,
      ReviewerName: reviewerName,
    },
  }));

  const reviewContent = getCommandOutput.Item?.Content;
  if (!reviewContent) {
    return apiResponse(404, { message: 'Review not found.' });
  }
  
  try {
    const translateParams = {
      Text: reviewContent,
      SourceLanguageCode: 'en',
      TargetLanguageCode: language,
    };
    const translatedMessage = await translate.translateText(translateParams).promise();
    return apiResponse(200, { translatedText: translatedMessage.TranslatedText });
  } catch (error) {
    console.error('Error in translation:', error);
    return apiResponse(500, { message: 'Unable to translate the review.' });
  }
};
