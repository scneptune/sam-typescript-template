import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import {
	InstructorPortalSharedSecrets,
	InstructorPortalOktaSecrets,
	OpenSearchSecrets,
	PinotSecrets,
} from '../types/secrets';

type SecretsValues = Partial<
	| InstructorPortalSharedSecrets
	| OpenSearchSecrets
	| PinotSecrets
	| InstructorPortalOktaSecrets
>;

type SecretsManagerCache = Record<string, SecretsValues>;

class SecretManagerService {
	private static instance: SecretManagerService;
	private secretsManager: SecretsManager;
	private cache: SecretsManagerCache;
	private region: string = 'us-west-2';

	private constructor() {
		this.secretsManager = new SecretsManager({ region: this.region });
		this.cache = {};
	}
	static getInstance(): SecretManagerService {
		if (!SecretManagerService.instance) {
			SecretManagerService.instance = new SecretManagerService();
		}
		return SecretManagerService.instance;
	}

	async getSharedSecrets(): Promise<InstructorPortalSharedSecrets> {
		const sharedSecretsId = process.env.SHARED_SECRETS_ID;

		const secrets = (await this.getSecrets(
			sharedSecretsId,
		)) as InstructorPortalSharedSecrets;
		return secrets;
	}

	async getSecrets(secretsId: string): Promise<SecretsValues> {
		if (
			Object.hasOwnProperty.call(this.cache, secretsId) &&
			Object.keys(this.cache[secretsId]).length > 0
		) {
			return this.cache[secretsId];
		} else {
			try {
				const secret = await this.secretsManager.getSecretValue({
					SecretId: secretsId,
				});
				this.cache[secretsId] = JSON.parse(secret.SecretString);
				return this.cache[secretsId];
			} catch (err) {
				console.error(
					'Encountered an error trying to fetch and parse secrets',
					err,
				);
				throw err;
			}
		}
	}
}

export default SecretManagerService;
