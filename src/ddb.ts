import {DescribeTableCommand, DynamoDBClient} from '@aws-sdk/client-dynamodb';
import type {
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import {BatchWriteCommand, DynamoDBDocumentClient, ScanCommand} from '@aws-sdk/lib-dynamodb';

const isTest = process.env.JEST_WORKER_ID;

let ddbv3ClientConfig: Object = isTest ? {
  endpoint: 'http://localhost:8000',
  tls: false,
  region: 'local-env',
  credentials: {
    accessKeyId: 'fakeMyKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  },
} : {};

export function setDbConfig(config: Object) {
  ddbv3ClientConfig = config;
}

let ddbv3Client: DynamoDBClient;
let ddbv3DocClient: DynamoDBDocumentClient;

function _getDdbv3Client(): DynamoDBClient {
  if (!ddbv3Client) {
    ddbv3Client = new DynamoDBClient(ddbv3ClientConfig);
  }
  return ddbv3Client;
}

function _getDdbv3DocClient(): DynamoDBDocumentClient {
  if (!ddbv3DocClient) {
    ddbv3DocClient = DynamoDBDocumentClient.from(_getDdbv3Client());
  }
  return ddbv3DocClient;
}

export function scan(params: ScanCommandInput): Promise<ScanCommandOutput> {
  const command = new ScanCommand(params);

  return _getDdbv3Client().send(command);
}

export async function getTableItemsCount(tableName: string): Promise<number> {
  const command = new DescribeTableCommand({TableName: tableName});
  const resp = await _getDdbv3Client().send(command);

  return resp.Table.ItemCount;
}

export function insertMany({
  items,
  tableName,
}: {
  items: any[];
  tableName: string;
}): Promise<BatchWriteCommandOutput> {
  const params: BatchWriteCommandInput['RequestItems'] = {
    [tableName]: items.map(item => {
      return {
        PutRequest: {
          Item: item,
        },
      };
    }),
  };

  return batchWrite(params);
}

function batchWrite(
  items: BatchWriteCommandInput['RequestItems']
): Promise<BatchWriteCommandOutput> {
  const command = new BatchWriteCommand({
    RequestItems: items,
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
  });

  return _getDdbv3DocClient().send(command);
}
