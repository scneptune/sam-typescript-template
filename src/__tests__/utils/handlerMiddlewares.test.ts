// Continuing from the previous example...
import { middlewares } from '../../utils/handlerMiddlewares';
import SecretsManagerService from '../../services/SecretsManagerService';
import mockEventHelper from './mockEventHelper';
import SecretManagerService from '../../services/SecretsManagerService';
import middy from '@middy/core';
// Mocked handler
const handler = async () => ({ statusCode: 200, body: JSON.stringify({}) });

const handlerWithMiddleware = (handler) =>
	middy(handler, { timeoutEarlyInMillis: 0 }).use(middlewares);

// We create a spy on the SecretsManagerService's setBrand method
const secretsManager = SecretsManagerService.getInstance();
const setBrandSpy = jest.spyOn(secretsManager, 'setBrand');

const emptyRequestContext = {
	accountId: '',
	apiId: '',
	protocol: '',
	httpMethod: 'GET',
	identity: undefined,
	path: '',
	stage: '',
	requestId: '',
	requestTimeEpoch: 0,
	resourceId: '',
	resourcePath: '',
};

describe('Middleware wrapper', () => {
	afterEach(() => {
		secretsManager.setBrand(undefined);
		setBrandSpy.mockReset();
		// setBrandSpy.mockRestore();
	});

	it('should set brandId if X-Referer-Override header is set', async () => {
		const event = mockEventHelper({
			headers: {
				'X-Referer-Override': process.env.MUSIC_ARTS_REFERER_URL,
			},
			requestContext: {
				authorizer: {},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('ma');
	});

	// Additional tests...

	it('should set brandId if Referer header is set', async () => {
		const event = mockEventHelper({
			headers: {
				Referer: process.env.MUSIC_ARTS_REFERER_URL,
			},
			requestContext: {
				authorizer: {},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('ma');
	});

	it('should set brandId if brandId is set in authorizer context', async () => {
		const event = mockEventHelper({
			headers: {},
			requestContext: {
				authorizer: {
					brandId: 'ma',
				},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('ma');
	});

	it('should default to "gc" if no Referer or X-Referer-Override is set', async () => {
		const event = mockEventHelper({
			headers: {},
			requestContext: {
				authorizer: {},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('gc');
	});

	it('should prefer X-Referer-Override over Referer if both are set', async () => {
		const event = mockEventHelper({
			headers: {
				'X-Referer-Override': process.env.MUSIC_ARTS_REFERER_URL,
				Referer: 'something-else',
			},
			requestContext: {
				authorizer: {},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('ma');
	});

	it('should prefer authorizer brandId over headers if both are set', async () => {
		const event = mockEventHelper({
			headers: {
				'X-Referer-Override': 'something-else',
				Referer: 'something-else',
			},
			requestContext: {
				authorizer: {
					brandId: 'ma',
				},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('ma');
	});

	// Negative path...

	it('should handle undefined headers gracefully', async () => {
		const event = mockEventHelper({
			headers: undefined,
			requestContext: {
				authorizer: {},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('gc');
	});

	it('should handle undefined requestContext gracefully', async () => {
		const event = mockEventHelper({
			headers: {
				'X-Referer-Override': process.env.MUSIC_ARTS_REFERER_URL,
			},
			requestContext: undefined,
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('ma');
	});

	it('should handle undefined authorizer gracefully', async () => {
		const event = mockEventHelper({
			headers: {
				'X-Referer-Override': process.env.MUSIC_ARTS_REFERER_URL,
			},
			requestContext: {
				authorizer: undefined,
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('ma');
	});

	it('should handle unexpected Referer values gracefully', async () => {
		const event = mockEventHelper({
			headers: {
				Referer: 'unexpected-value',
			},
			requestContext: {
				authorizer: {},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('gc');
	});

	it('should handle unexpected X-Referer-Override values gracefully', async () => {
		const event = mockEventHelper({
			headers: {
				'X-Referer-Override': 'unexpected-value',
			},
			requestContext: {
				authorizer: {},
				...emptyRequestContext,
			},
		});

		await handlerWithMiddleware(handler)(event, null, null);
		expect(setBrandSpy).toHaveBeenCalledWith('gc');
	});
});
