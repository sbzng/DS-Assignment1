import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient, PutItemCommandInput,PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamodb = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dynamodb);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const parameters = event?.pathParameters;
  const body = event.body ? JSON.parse(event.body) : null;

  if (!body || !parameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing request body or path parameters" }),
    };
  }

  const { reviewerName, movieId } = parameters;
  const { content, rating } = body;

  if (!movieId || !reviewerName || !content || rating === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" }),
    };
  }

  if (!process.env.TABLE_NAME) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server configuration error" }),
    };
  }

  const putParams: PutItemCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: {
      movieId: { N: movieId.toString() },
      reviewerName: { S: reviewerName },
      content: { S: content },
      reviewDate: { S: new Date().toISOString() },
      rating: { N: rating.toString() },
    },
    ConditionExpression: "attribute_not_exists(movieId) AND attribute_not_exists(reviewerName)",
  };

  try {
    await ddbDocClient.send(new PutItemCommand(putParams));
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Movie review modified" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};
