import AWSLambda from 'aws-lambda';
export type BrandTypes = 'gc' | 'ma';
export interface Context extends AWSLambda.Context {
	brandId: BrandTypes;
}
