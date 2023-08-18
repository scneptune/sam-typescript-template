// BEGIN: 9f8e7d1c8f5a
import validateJsonSchema, {
	SchemaConfig,
} from '../../utils/validateJSONSchema';

describe('validateJsonSchema', () => {
	const schema: SchemaConfig = {
		name: { type: 'string' },
		age: { type: 'number', isOptional: true },
		isStudent: { type: 'boolean' },
		grades: { type: 'array', enumValues: ['A', 'B', 'C', 'D', 'F'] },
		address: { type: 'object' },
	};

	it('should return true for a valid object', () => {
		const obj = {
			name: 'John Doe',
			isStudent: true,
			grades: ['A', 'B', 'C'],
			address: { street: '123 Main St', city: 'Anytown', state: 'CA' },
		};
		expect(validateJsonSchema(obj, schema)).toBe(true);
	});

	it('should return false for an object with missing required property', () => {
		const obj = {
			name: 'John Doe',
			grades: ['A', 'B', 'C'],
			address: { street: '123 Main St', city: 'Anytown', state: 'CA' },
		};
		expect(validateJsonSchema(obj, schema)).toBe(false);
	});

	it('should return true for an object with optional property missing', () => {
		const obj = {
			name: 'John Doe',
			isStudent: true,
			grades: ['A', 'B', 'C'],
			address: { street: '123 Main St', city: 'Anytown', state: 'CA' },
		};
		expect(validateJsonSchema(obj, schema)).toBe(true);
	});

	it('should return false for an object with invalid property type', () => {
		const obj = {
			name: 'John Doe',
			isStudent: true,
			grades: ['A', 'B', 'C'],
			address: '123 Main St, Anytown, CA',
		};
		expect(validateJsonSchema(obj, schema)).toBe(false);
	});

	it('should return false for an object with invalid enum value', () => {
		const obj = {
			name: 'John Doe',
			isStudent: true,
			grades: ['A', 'B', 'C', 'E'],
			address: { street: '123 Main St', city: 'Anytown', state: 'CA' },
		};
		expect(validateJsonSchema(obj, schema)).toBe(false);
	});
});
// END: 9f8e7d1c8f5a
