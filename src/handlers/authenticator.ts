import 'source-map-support/register';
// This function is used to authenticate user JWT tokens with Okta.
// It will take an authorization header which is a bearer token and then use the introspection endpoint to validate the token.
// If the token is valid, it will return a IAM policy that will allow the user to continue to call the Lambda function
// if it is not, the user will get a 401 Unauthorized response.
import type {
	APIGatewayAuthorizerResult,
	APIGatewayRequestAuthorizerEvent,
	APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda';
// import axios from 'axios';
import OktaJwtVerifier from '@okta/jwt-verifier';
import extractArnPath from '../utils/extractArnPath';
import SecretManagerService from '../services/SecretsManagerService';
import { StageVariables } from '../types/secrets';

// TODO: Temporarily commented out until we get can get access tokens.
// async function fetchOktaUserProfile(
//   bearerToken: string,
// ): Promise<OktaFullProfile> {
//   const response = await axios.get(
//     `https://${process.env.OKTA_ISSUER_URI}/oauth2/v1/userinfo`,
//     {
//       headers: {
//         Authorization: bearerToken,
//         Accept: 'application/json',
//       },
//     },
//   );
//   if (response.statusText !== 'OK') {
//     throw new Error(
//       `Failed to fetch user profile from Okta, ${response.statusText}`,
//     );
//   }
//   return JSON.parse(response.data);
// }

export const handler = async function (
	event: APIGatewayRequestAuthorizerEvent & {
		stageVariables: StageVariables;
	},
): Promise<APIGatewayAuthorizerResult> {
	// please note as of now, whats being passed here is the
	// ID TOKEN JWT and not the ACCESS TOKEN JWT, for this reason:
	// https://support.okta.com/help/s/article/Signature-Validation-Failed-on-Access-Token?language=en_US
	// Until we get a custom authorization server, we will not be able to get the access token.
	const authenicationToken =
		// Titlecase is acceptable in localhost but not in production, wtf amazon?
		// see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html
		event.headers.authorization ?? event.headers.Authorization;
	if (!authenicationToken) {
		throw new Error('Unauthorized - Missing Authorization Header');
	}
	const validateToken = authenicationToken.match(/^Bearer .+$/i);
	if (!validateToken) {
		console.error('Invalid token format:', { authenicationToken });
		throw new Error('Unauthorized - Invalid token format');
	}
	const secretsManager = SecretManagerService.getInstance();
	secretsManager.setSharedSecretsId(event?.stageVariables?.SHARED_SECRETS_ID);
	const secrets = await secretsManager.getSharedSecrets();
	const token = authenicationToken.split(' ')[1].trim();
	const oktaTokenIntrospection = new OktaJwtVerifier({
		issuer: secrets.OKTA_ISSUER_URI,
		jwksUri: `${secrets.OKTA_ISSUER_URI}/oauth2/v1/keys`,
	});

	try {
		const jwtTokenResponse = await oktaTokenIntrospection.verifyIdToken(
			token,
			secrets.OKTA_CLIENT_ID,
		);
		// const userProfileResponse = await fetchOktaUserProfile(authenicationToken);
		try {
			const arnRouteParsed = extractArnPath(event.methodArn);
			try {
				return {
					principalId: jwtTokenResponse.claims.sub,
					policyDocument: {
						Version: '2012-10-17',
						Statement: [
							{
								Action: 'execute-api:Invoke',
								Effect: 'Allow',
								Resource: `arn:aws:execute-api:${arnRouteParsed.region}:${
									arnRouteParsed.accountId
								}:${arnRouteParsed.apiId}${
									!!arnRouteParsed?.stage ? '/' + arnRouteParsed.stage : ''
								}/*/*`,
							},
						],
					},
					context: {
						// uid: jwtTokenResponse.claims.sub,
						// storeId: userProfileResponse.storeId,
						// employeeId: userProfileResponse.employeeId,
						...event?.stageVariables,
					},
				};
			} catch (error) {
				console.error('Unable to parse Referer');
				throw error;
			}
		} catch (error) {
			console.error('Unable to parse Resource Arn');
			throw error;
		}
	} catch (error) {
		console.error('Unable to verify token:', { error });
		return {
			principalId: 'unauthorized',
			policyDocument: {
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'execute-api:Invoke',
						Effect: 'Deny',
						Resource: event.methodArn,
					},
				],
			},
		};
	}
};
