import SecretsManagerService from '../services/SecretsManagerService';
import { InstructorPortalSharedSecrets } from '../types/secrets';

export default function withSharedSecretsMiddleware(callback) {
	return async function (...args) {
		const secretsManager = SecretsManagerService.getInstance();
		const secrets =
			(await secretsManager.getSharedSecrets()) as InstructorPortalSharedSecrets;
		const boundCallback = callback.bind({ secrets });
		return boundCallback(...args);
	};
}
