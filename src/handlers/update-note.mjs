import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.NOTES_TABLE_NAME;

export const updateNoteHandler = async (event) => {
  if (event.httpMethod !== "PUT") {
    throw new Error(`updateNote only accepts PUT, you tried: ${event.httpMethod}`);
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

  const { title, content } = body;

  // 允許更新 title/content 任一個，但唔可以兩個都冇
  if (title === undefined && content === undefined) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Nothing to update (provide title and/or content)" })
    };
  }

  const now = new Date().toISOString();

  // 動態組 expression，避免 set 到 undefined
  const sets = [];
  const values = { ":u": now };
  const names = { "#updatedAt": "updatedAt" };

  sets.push("#updatedAt = :u");

  if (title !== undefined) {
    names["#title"] = "title";
    values[":t"] = title;
    sets.push("#title = :t");
  }
  if (content !== undefined) {
    names["#content"] = "content";
    values[":c"] = content;
    sets.push("#content = :c");
  }

  const params = {
    TableName: tableName,
    Key: { userId, noteId },
    UpdateExpression: `SET ${sets.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW"
  };

  try {
    const data = await ddbDocClient.send(new UpdateCommand(params));

    // 如果 key 唔存在，Update 仍然可能 upsert；我哋用 ConditionExpression 防止 upsert（加分）
    // 先簡化：下一步我再帶你加 ConditionExpression 做「不存在就 404」

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.Attributes)
    };
  } catch (err) {
    console.error("DynamoDB update error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Failed to update note" })
    };
  }
};
