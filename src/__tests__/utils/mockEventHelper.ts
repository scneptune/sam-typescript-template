import { APIGatewayProxyEvent } from 'aws-lambda';
import _ from 'lodash';

export default function mockEventHelper(
	overrides?: Partial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent {
	const defaultEvent: APIGatewayProxyEvent = {
		body: null,
		headers: {},
		multiValueHeaders: {},
		httpMethod: 'GET',
		isBase64Encoded: false,
		path: '',
		pathParameters: null,
		queryStringParameters: null,
		multiValueQueryStringParameters: null,
		stageVariables: null,
		requestContext: {
			accountId: '123456789012',
			apiId: 'abcde1fghij',
			httpMethod: 'GET',
			identity: {
				accessKey: null,
				accountId: null,
				apiKey: null,
				apiKeyId: null,
				caller: null,
				cognitoAuthenticationProvider: null,
				cognitoAuthenticationType: null,
				cognitoIdentityId: null,
				cognitoIdentityPoolId: null,
				sourceIp: '127.0.0.1',
				user: null,
				userAgent: null,
				userArn: null,
				clientCert: undefined,
				principalOrgId: '',
			},
			requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
			resourceId: '123456',
			resourcePath: '/',
			stage: 'prod',
			authorizer: {},
			requestTimeEpoch: 0,
			protocol: '',
			path: '',
		},
		resource: '/',
	};

	return _.merge({}, defaultEvent, overrides);
}
