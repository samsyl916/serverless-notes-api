// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.NOTES_TABLE_NAME;

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
export const putItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }

    console.info('received:', event);

    let body;
    try {
        body = event.body ? JSON.parse(event.body) : {};
    } catch {
        return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Invalid JSON body" })
        };
    }

    const { userId, title, content } = body;

    if (!userId || !title) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Missing required fields: userId, title" })
        };
    }
    const now = new Date().toISOString();
    const noteId = randomUUID();

    const item = {
        userId,
        noteId,
        title,
        content: content ?? "",
        createdAt: now,
        updatedAt: now
    };

    const params = {
        TableName: tableName,
        Item: item
    };

    try {
        await ddbDocClient.send(new PutCommand(params));
    } catch (err) {
        console.error("DynamoDB put error", err);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Failed to create note" })
        };
    }

    const response = {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
    };

    return response;
};
