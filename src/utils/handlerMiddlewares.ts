import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import cors from '@middy/http-cors';
import errorLogger from '@middy/error-logger';
import { APIGatewayProxyHandler } from 'aws-lambda';

import SecretManagerService from '../services/SecretsManagerService';
export function sharedSecretsStageVarBindToProcess() {
	return {
		// This allows us to use the shared secrets middleware deeper
		// in our function because SecretsManagerService is a singleton.
		before(request) {
			const { event } = request;
			const sharedSecretsId = event.stageVariables?.SHARED_SECRETS_ID;
			if (sharedSecretsId) {
				const secretManagerInstance = SecretManagerService.getInstance();
				secretManagerInstance.setSharedSecretsId(sharedSecretsId);
			}
		},
	};
}

export const middlewares = [
	//makes it so event always has properties of a normal APIGatewayProxyEvent instead of null fields.
	sharedSecretsStageVarBindToProcess(),
	httpEventNormalizer(),
	cors({
		// credentials: true,
		// origin: 'localhost:3000',
		origin: '*',
		headers:
			'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
		methods: 'GET,OPTIONS,POST,DELETE,PUT',
	}),
	httpErrorHandler({ fallbackMessage: 'An unknown error occurred.' }),
	errorLogger(),
];

export default function handlerWithMiddleware(handler: APIGatewayProxyHandler) {
	return middy(handler).use(middlewares);
}
