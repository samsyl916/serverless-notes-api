# Serverless Notes API (AWS SAM + API Gateway + Lambda + DynamoDB)

A production-style MVP serverless REST API demonstrating CRUD operations on a DynamoDB single-table design, deployed with AWS SAM (CloudFormation).

## Architecture
API Gateway (REST) → Lambda (Node.js 20) → DynamoDB (PK/SK)

- **API Gateway** routes requests to dedicated Lambda handlers (single responsibility per endpoint).
- **Lambda** uses AWS SDK v3 (DynamoDB DocumentClient).
- **DynamoDB** single-table design:
  - Partition Key: `userId` (S)
  - Sort Key: `noteId` (S)
- **IAM least privilege** using SAM managed policies (Read vs CRUD).
- **Structured logging** enabled for CloudWatch.

## Endpoints

> Current MVP uses `userId` via query string (e.g. `?userId=sam`).  
> In a hardened version, `userId` should come from an authorizer/JWT claims.

### Create
- `POST /notes`
  - Body:
    ```json
    { "userId": "sam", "title": "first note", "content": "hello" }
    ```
  - Response: `201 Created` with the created note (server-generated `noteId`, `createdAt`, `updatedAt`)

### Read (list)
- `GET /notes?userId=sam`
  - Uses DynamoDB **Query** (no Scan)

### Read (one)
- `GET /notes/{noteId}?userId=sam`
  - Returns `404` if not found

### Update
- `PUT /notes/{noteId}?userId=sam`
  - Body (partial allowed):
    ```json
    { "title": "updated title" }
    ```

### Delete
- `DELETE /notes/{noteId}?userId=sam`
  - Returns `204 No Content`
  - Subsequent GET returns `404`

## Local Development

### Prerequisites
- Node.js 20+
- AWS SAM CLI
- AWS CLI configured (`aws sts get-caller-identity`)

### Build
```bash
sam build
 learn how authors developed their applications. For more information, see the [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/) and the [AWS Serverless Application Repository Developer Guide](https://docs.aws.amazon.com/serverlessrepo/latest/devguide/what-is-serverlessrepo.html).
