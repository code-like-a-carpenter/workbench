import type {
  AWSLogsLogGroup,
  Model as ServerlessApplicationModel,
} from '../../__generated__/serverless-application-model';

export interface LogGroupInput {
  functionName: string;
}

/** cloudformation generator */
export function makeLogGroup({
  functionName,
}: LogGroupInput): ServerlessApplicationModel {
  const logGroup: AWSLogsLogGroup = {
    Properties: {
      // @ts-expect-error - typedef doesn't know about Fn::Sub
      LogGroupName: {'Fn::Sub': `/aws/lambda/\${${functionName}}`},
      // @ts-expect-error - typedef doesn't know about Ref
      RetentionInDays: {Ref: 'LogRetentionInDays'},
    },
    Type: 'AWS::Logs::LogGroup',
  };

  return {
    Parameters: {
      LogRetentionInDays: {
        Default: '3',
        Description: 'Log retention in days',
        Type: 'Number',
      },
    },
    Resources: {
      [`${functionName}LogGroup`]: logGroup,
    },
  };
}
