import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface HitCounterProps {
  // the function for which we want to count url hits
  downstream: lambda.IFunction;
  /**
   * The read capacity units for the table
   * Must be between 5 and 20, inclusive
   */
  readCapacity?: number;
}

export class HitCounter extends Construct {
  // allows accessing the counter function
  public readonly handler: lambda.Function;
  // allow accessing the hit counter table
  public readonly table: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: HitCounterProps) {
    if (
      props.readCapacity !== undefined &&
      (props.readCapacity < 5 || props.readCapacity > 20)
    ) {
      throw new Error("readCapacity must be greater than 5 and less than 20");
    }

    super(scope, id);

    // define a table to store url hit counts
    const table = new dynamodb.TableV2(this, "Hits", {
      partitionKey: { name: "path", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
      billing: dynamodb.Billing.provisioned({
        readCapacity: dynamodb.Capacity.autoscaled({
          seedCapacity: props.readCapacity || 5,
          minCapacity: 5,
          maxCapacity: 20,
        }),
        writeCapacity: dynamodb.Capacity.autoscaled({
          seedCapacity: 5,
          maxCapacity: 15,
        }),
      }),
    });
    this.table = table;

    // defines a new Lambda function
    this.handler = new lambda.Function(this, "HitCounterHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hitcounter.handler",
      environment: {
        DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
        HITS_TABLE_NAME: table.tableName,
      },
    });

    // grant the lambda role read/write permissions to our table
    table.grantReadWriteData(this.handler);

    // grant the lambda role invoke permissions to the downstream function
    props.downstream.grantInvoke(this.handler);
  }
}
