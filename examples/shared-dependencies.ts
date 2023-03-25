// Create service client module using ES6 syntax.
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import cuid from 'cuid';

/** Figure out the correct URL for lambda to lambda calls. */
function getEndpointUrl() {
  if (process.env.LOCALSTACK_HOSTNAME && process.env.EDGE_PORT) {
    return `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT}`;
  }

  if (process.env.AWS_ENDPOINT) {
    return process.env.AWS_ENDPOINT;
  }

  return undefined;
}

export const ddb = new DynamoDBClient({
  endpoint: getEndpointUrl(),
});

const marshallOptions = {
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: false, // false, by default.
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: false, // false, by default.
};

const unmarshallOptions = {
  // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
  wrapNumbers: false, // false, by default.
};

const translateConfig = {marshallOptions, unmarshallOptions};

// Create the DynamoDB Document client.
export const ddbDocClient = DynamoDBDocumentClient.from(ddb, translateConfig);

/** Generates unique, random ids */
export function idGenerator() {
  return cuid();
}
