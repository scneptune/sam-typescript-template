import { HttpRequest, HttpResponse } from '@aws-sdk/protocol-http';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { HttpRequest as IHttpRequest } from '@aws-sdk/types';
import SecretsManagerService from './SecretsManagerService';

type RequestTemplate = Partial<IHttpRequest>;

export default class ExampleHTTPAPIService {
	private endpoint: string;
	private secretsManager: SecretsManagerService;
	private requestTemplate: RequestTemplate;
	constructor() {
		this.secretsManager = SecretsManagerService.getInstance();
	}

	private async init() {
		const secrets = await this.secretsManager.getSharedSecrets();
		this.endpoint = secrets.EXAMPLE_API_URL;
		const { host, protocol } = new URL(this.endpoint);
		this.requestTemplate = {
			protocol: protocol.replace(':', ''),
			headers: {
				'Content-Type': 'application/json',
				host: host,
			},
			hostname: host,
		};
	}

	private async handleResponseBody(response: HttpResponse) {
		let responseBody = '';
		await new Promise((resolve, reject) => {
			response.body.on('data', (chunk) => {
				responseBody += chunk;
			});
			response.body.on('end', resolve);
			response.body.on('error', reject);
		});

		return JSON.parse(responseBody);
	}

	public async getRoute({ data }: Record<any, any>): Promise<any> {
		await this.init();
		const request = {
			...this.requestTemplate,
			body: JSON.stringify(data),
			method: 'GET',
			path: '/example/api/route/path',
		} as IHttpRequest;
		const client = new NodeHttpHandler();
		const { response } = await client.handle(new HttpRequest(request));
		const result = await this.handleResponseBody(response);
		return result;
	}
}
