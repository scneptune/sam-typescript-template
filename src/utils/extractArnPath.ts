import { validate, parse } from '@aws-sdk/util-arn-parser';

const ARN_STAGE = 'prod';
const ARN_STAGE_ALT = 'stage';
export default function extractArnPath(arnName: string) {
	// this is a hacky way to get the region, account id, api id, and stage from the AWS ARN

	if (validate(arnName)) {
		const arnObject = parse(arnName);
		const { region, service, accountId, resource } = arnObject;

		const [apiKeyHash, ...resourcePathParts] = resource.split('/');

		const stage =
			resourcePathParts.find((part) => {
				const normalizedPart = part.toLowerCase();
				return (
					normalizedPart.includes(ARN_STAGE) ||
					normalizedPart.includes(ARN_STAGE_ALT)
				);
			}) ?? null;

		return {
			service,
			region,
			accountId,
			apiId: apiKeyHash,
			stage,
			resourceRemainder: stage
				? resourcePathParts.filter((part) => part !== stage).join('/')
				: resourcePathParts.join('/'),
		};
	}
	throw Error('Invalid ARN');
}
