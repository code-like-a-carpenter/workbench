/** cloudformation generator */
import type {AWSLogsLogGroup} from '../__generated__/json-schemas/serverless-application-model';
import type {ServerlessApplicationModel} from '../types';

export interface LogGroupInput {
  functionName: string;
}

/** cloudformation generator */
export function makeLogGroup({
  functionName,
}: LogGroupInput): ServerlessApplicationModel {
  const logGroup: AWSLogsLogGroup = {
    Properties: {
      // @ts-expect-error typedef doesn't include intrinsic functions
      LogGroupName: {'Fn::Sub': `/aws/lambda/\${${functionName}}`},
      // @ts-expect-error typedef doesn't include intrinsic functions
      RetentionInDays: {Ref: 'LogRetentionInDays'},
    },
    Type: 'AWS::Logs::LogGroup',
  };

  return {
    Outputs: {
      LogGroupName: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-LogGroupName'},
        },
        Value: {Ref: `${functionName}LogGroup`},
      },
    },
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
