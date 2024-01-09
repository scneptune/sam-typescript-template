import SecretsManagerService from '../services/SecretsManagerService';
import { SharedSecrets } from '../types/secrets';

export default function withSharedSecretsMiddleware(callback) {
	return async function (...args) {
		const secretsManager = SecretsManagerService.getInstance();
		const secrets = (await secretsManager.getSharedSecrets()) as SharedSecrets;
		const boundCallback = callback.bind({ secrets });
		return boundCallback(...args);
	};
}
