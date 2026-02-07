// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.NOTES_TABLE_NAME;

/**
 * A simple example includes a HTTP get method to get all items from a DynamoDB table.
 */
export const getAllItemsHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }

    const userId = event?.queryStringParameters?.userId;

    if (!userId) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Missing required query parameter: userId" })
        };
    }

    var params = {
        TableName : tableName,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: {
            ":u": userId
        }
    };

    const data = await ddbDocClient.send(new QueryCommand(params));
    const notes = data.Items ?? [];

    const response = {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notes })
    };

    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
