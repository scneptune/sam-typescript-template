// this is a simple testing hello world function behind authentification

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import handlerWithMiddleware from '../utils/handlerMiddlewares';
import SimpleEmailSerivce from '../services/SimpleEmailService';
import SecretManagerService from '../services/SecretsManagerService';

export const handler = handlerWithMiddleware(
	async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
		const mailerInfo = new SimpleEmailSerivce();
		try {
			const secretManagerInstance = SecretManagerService.getInstance();
			const sharedSecrets = await secretManagerInstance.getSharedSecrets();
			const mailer = await mailerInfo.sendEmail(
				(
					(sharedSecrets?.TESTING_EMAIL ||
						decodeURIComponent(event.queryStringParameters.email)) ??
					'donotreply@guitarcenter.com'
				)
					.split(',')
					.map((email: string) => email.trim()),
				'Test Email from Lambda',
				`<html><head></head><body><p>This is a test email from Lambda. You sent this from instructor portal.</p> 
				<p>here is the lambda event: </p>
				<code>${JSON.stringify(event, null, 2)}</code>
				</body></html>`,
			);
			return {
				statusCode: 200,
				body: JSON.stringify(
					{
						message: mailer,
						input: event,
					},
					null,
					2,
				),
			};
		} catch (error) {
			console.error(error);
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	},
);
