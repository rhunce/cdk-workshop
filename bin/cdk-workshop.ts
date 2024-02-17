#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkWorkshopStack } from "../lib/cdk-workshop-stack";

// This is the entrypoint of our application
// It will load the stack defined in /lib/cdk-workshop-stack
const app = new cdk.App();
new CdkWorkshopStack(app, "CdkWorkshopStack");
