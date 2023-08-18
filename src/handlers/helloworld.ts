// this is a simple testing hello world function behind authentification

import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
	return {
		statusCode: 200,
		body: JSON.stringify(
			{
				message: `Hello World'!`,
				input: event,
			},
			null,
			2,
		),
	};
};
