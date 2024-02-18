import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { HitCounter } from "./hitcounter";

// This is where the main stack is defined
export class CdkWorkshopStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // lambda function "HelloHandler"
    const hello = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_16_X, // execution environment
      code: lambda.Code.fromAsset("lambda"), // code loaded from the "lambda" directory
      handler: "hello.handler", // file is "hello", function is "handler"
    });

    // custom construct "HelloHitCounter"
    const helloWithCounter = new HitCounter(this, "HelloHitCounter", {
      downstream: hello,
    });

    // API Gateway "Endpoint"
    new apigateway.LambdaRestApi(this, "Endpoint", {
      handler: helloWithCounter.handler,
    });
  }
}
