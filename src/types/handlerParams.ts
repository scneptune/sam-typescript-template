import AWSLambda from 'aws-lambda';
export type BrandTypes = 'gc' | 'ma';
export interface Context extends AWSLambda.Context {
	BRAND_ID: BrandTypes;
	SHARED_SECRETS_ID: string;
}
