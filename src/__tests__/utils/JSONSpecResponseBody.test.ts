import JSONSpecResponseBody, {
	JSONAPIDataResponse,
} from '../../utils/JSONSpecResponseBody';

describe('JSONSpecResponseBody Basecases', () => {
	const type = 'testType';
	const validInput = { id: '1', values: 'abc' };
	const invalidInput = { values: 'abc' }; // no id property

	it('Ensures a JSONSpecResponseBody instance returned', () => {
		const instance = new JSONSpecResponseBody(type, validInput);
		expect(instance).toBeInstanceOf(JSONSpecResponseBody);
	});

	it('Throws an error if no type is provided', () => {
		expect(() => new JSONSpecResponseBody('', validInput)).toThrow(
			'Invalid type provided: type must be a non-empty string',
		);
	});

	it('Throws an error if an object without an id property is provided', () => {
		//tslint:disable-next-line: missing-type
		// @ts-ignore
		expect(() => new JSONSpecResponseBody(type, invalidInput)).toThrow(
			'Invalid obj: object must have an id property in order to be transformed into a JSONAPIResponse',
		);
	});

	it('Transforms a single simple object correctly', () => {
		const instance = new JSONSpecResponseBody(type, validInput);
		const response = instance.formatAsResponse();

		expect(response).toEqual({
			data: {
				type,
				id: validInput.id,
				attributes: { values: validInput.values },
			},
		});
	});
});

describe('JSONSpecResponseBody relationships', () => {
	const type = 'plants';

	// 1. Transform an object with a single relationship
	it('Transforms an object with a single relationship correctly', () => {
		const input = {
			id: '1',
			value1: 'value',
			relationships: {
				id: '2',
				type: 'vegetable',
				property1: 'propertyValue',
			},
		};
		const instance = new JSONSpecResponseBody(type, input);
		const response = instance.formatAsResponse();
		// not great to cast this but its not like we will reading back this data to ourselves at this point.
		const objectRelationships = (response.data as JSONAPIDataResponse)
			.relationships;
		// Check if the response is formatted correctly
		expect(objectRelationships.vegetable).toBeDefined();
	});

	// 2. Transform an object with multiple relationships of the same type
	it('Transforms an object with multiple relationships of the same type correctly', () => {
		const input = {
			id: '1',
			attribute: 'value',
			relationships: [
				{ id: '2', type: 'fruit', property: 'propertyValue' },
				{ id: '3', type: 'fruit', property: 'anotherPropertyValue' },
			],
		};
		const instance = new JSONSpecResponseBody(type, input);
		const response = instance.formatAsResponse();

		// not great to cast this but its not like we will reading back this data to ourselves at this point.
		const objectRelationships = (response.data as JSONAPIDataResponse)
			.relationships;
		// Check if the relationships are grouped correctly
		expect(Array.isArray(objectRelationships.fruit.data)).toBe(true);
		expect(
			(objectRelationships.fruit.data as JSONAPIDataResponse[]).length,
		).toBe(2);
	});

	// 3. Transform an object with multiple relationships of different types
	it('Transforms an object with multiple relationships of different types correctly', () => {
		const input = {
			id: '1',
			attribute: 'value',
			relationships: [
				{ id: '2', type: 'vegatables', property: 'propertyValue' },
				{ id: '3', type: 'fruits', property: 'anotherPropertyValue' },
			],
		};
		const instance = new JSONSpecResponseBody(type, input);
		const response = instance.formatAsResponse();

		const objectRelationships = (response.data as JSONAPIDataResponse)
			.relationships;
		// Check if the relationships are grouped by type
		expect(objectRelationships.vegatables).toBeDefined();
		expect(objectRelationships.fruits).toBeDefined();
	});

	// 4. Throw an error when a relationship object doesn't have a type property
	it('Throws an error if a relationship object does not have a type property', () => {
		const input = {
			id: '1',
			attribute: 'value',
			relationships: {
				id: '2',
				property: 'propertyValue',
			},
		};
		expect(() => new JSONSpecResponseBody(type, input)).toThrow(
			"Each relationship object must have a 'type' attribute",
		);
	});

	// 5. Throw an error when a relationship object in an array doesn't have a type property
	it('Throws an error if a relationship object in an array does not have a type property', () => {
		const input = {
			id: '1',
			attribute: 'value',
			relationships: [
				{ id: '2', type: 'relationType', property: 'propertyValue' },
				{ id: '3', property: 'anotherPropertyValue' },
			],
		};
		expect(() => new JSONSpecResponseBody(type, input)).toThrow(
			"Each relationship object in the array of 'relationships' must have a 'type' attribute",
		);
	});

	// 6. A relationship object should be well formed according to JSON API spec
	it('A relationship object should be well formed', () => {
		const input = {
			id: '1',
			value: 'value',
			relationships: [{ id: '2', type: 'fruit', property: 'propertyValue' }],
		};
		const baseObject = new JSONSpecResponseBody(type, input).formatAsResponse();
		const parentData = baseObject.data as JSONAPIDataResponse;
		const relationships = parentData.relationships;
		// despite being passed in as an array, the relationship object
		// should be formatted as a single object in this case, if we had more than one it would be an array
		const innerData = relationships.fruit.data as JSONAPIDataResponse;
		expect(relationships.fruit).toBeDefined();
		expect(innerData).toBeDefined();
		expect(innerData.id).toBeDefined();
		expect(innerData.type).toBeDefined();
		expect(innerData.attributes.property).toBe(input.relationships[0].property);
	});
});
