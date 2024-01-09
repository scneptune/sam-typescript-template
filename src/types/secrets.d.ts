export interface SharedSecrets extends OktaOauthSecrets {
	POSTMAN_ENV?: string;
	SCHEDULER_URL: string;
	STUDENTS_TABLE_ID: string;
	SES_SENDER: string;
	TESTING_EMAIL?: string;
}

export interface OktaOauthSecrets {
	OKTA_ISSUER_URI: string;
	OKTA_CLIENT_ID: string;
	OKTA_CLIENT_SECRET: string;
}

export interface StageVariables {
	SHARED_SECRETS_ID: string;
	BRAND_ID: string;
}
