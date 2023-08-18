export {};
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			SHARED_SECRETS_ID: string;
			NODE_ENV: 'development' | 'production';
			PORT?: string;
			PWD: string;
		}
	}
}
