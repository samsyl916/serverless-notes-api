import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.NOTES_TABLE_NAME;

export const deleteNoteHandler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    throw new Error(`deleteNote only accepts DELETE, you tried: ${event.httpMethod}`);
  }

  const noteId = event?.pathParameters?.noteId;
  const userId = event?.queryStringParameters?.userId;

  if (!userId || !noteId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing required parameters: userId and noteId" })
    };
  }

  const params = {
    TableName: tableName,
    Key: { userId, noteId }
  };

  try {
    await ddbDocClient.send(new DeleteCommand(params));
    return {
      statusCode: 204,
      body: ""
    };
  } catch (err) {
    console.error("DynamoDB delete error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Failed to delete note" })
    };
  }
};
