import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as node from 'aws-cdk-lib/aws-lambda-nodejs';
export class AuthApiStack extends cdk.Stack {
  private auth: apig.IResource;
  private userPoolId: string;
  private userPoolClientId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, 'UserPool', {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolId = userPool.userPoolId;

    const appClient = userPool.addClient('AppClient', {
      authFlows: { userPassword: true },
    });

    this.userPoolClientId = appClient.userPoolClientId;

    new cdk.CfnOutput(this, 'UserPoolIdOutput', {
      value: this.userPoolId,
      exportName: `${this.stackName}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientIdOutput', {
      value: this.userPoolClientId,
      exportName: `${this.stackName}-UserPoolClientId`,
    });

    const authApi = new apig.RestApi(this, 'AuthServiceApi', {
      description: 'Authentication Service RestApi',
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    this.auth = authApi.root.addResource('auth');

    this.addAuthRoute('signup', 'POST', 'SignupFn', 'signup.ts');
    this.addAuthRoute('confirm_signup', 'POST', 'ConfirmFn', 'confirm-signup.ts',
    );
    this.addAuthRoute('signout', 'GET', 'SignoutFn', 'signout.ts');
    this.addAuthRoute('signin', 'POST', 'SigninFn', 'signin.ts');
  }

  private addAuthRoute(
    resourceName: string,
    method: string,
    fnName: string,
    fnEntry: string,
  ): void {
    const commonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      environment: {
        USER_POOL_ID: this.userPoolId,
        CLIENT_ID: this.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };

    const resource = this.auth.addResource(resourceName);

    const fn = new node.NodejsFunction(this, fnName, {
      ...commonFnProps,
      entry: `${__dirname}/../lambdas/auth/${fnEntry}`,
    });

    resource.addMethod(method, new apig.LambdaIntegration(fn));
  }
}