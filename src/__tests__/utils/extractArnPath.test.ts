import extractArnPath from '../../utils/extractArnPath';

describe('extractArnPath', () => {
	it('should extract the correct values from a valid ARN', () => {
		const arn =
			'arn:aws:execute-api:us-east-1:123456789012:my-api-id/my-stage/GET/my-resource/my-child-resource-1/my-child-resource-2';
		const expected = {
			service: 'execute-api',
			region: 'us-east-1',
			accountId: '123456789012',
			apiId: 'my-api-id',
			stage: 'my-stage',
			resourceRemainder:
				'GET/my-resource/my-child-resource-1/my-child-resource-2',
		};
		expect(extractArnPath(arn)).toEqual(expected);
	});

	it('should throw an error for an invalid ARN', () => {
		const arn = 'invalid-arn';
		expect(() => extractArnPath(arn)).toThrow('Invalid ARN');
	});

	it('parse a valid ARN', () => {
		const arn =
			'arn:aws:execute-api:us-west-2:123456789012:1234567890/Prod/GET/employees/120109/students/1250316425/submissions';
		const expected = {
			service: 'execute-api',
			region: 'us-west-2',
			accountId: '123456789012',
			apiId: '1234567890',
			stage: 'Prod',
			resourceRemainder: 'GET/employees/120109/students/1250316425/submissions',
		};
		expect(extractArnPath(arn)).toEqual(expected);
	});
});
