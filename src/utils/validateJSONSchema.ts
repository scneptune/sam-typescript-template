type PropertyType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface PropertyConfig {
	type: PropertyType;
	enumValues?: any[];
	isOptional?: boolean;
}

export interface SchemaConfig {
	[key: string]: PropertyConfig;
}

export default function validateJsonSchema(
	obj: any,
	schema: SchemaConfig,
): boolean {
	for (const key in schema) {
		const propertyConfig = schema[key];
		const value = obj[key];

		if (value === undefined) {
			if (propertyConfig.isOptional) {
				continue;
			} else {
				return false;
			}
		}

		switch (propertyConfig.type) {
			case 'string':
				if (typeof value !== 'string') return false;
				break;
			case 'number':
				if (typeof value !== 'number') return false;
				break;
			case 'boolean':
				if (typeof value !== 'boolean') return false;
				break;
			case 'object':
				if (typeof value !== 'object') return false;
				break;
			case 'array':
				if (!Array.isArray(value)) return false;
				break;
		}

		if (
			propertyConfig.enumValues &&
			!propertyConfig.enumValues.includes(value)
		) {
			return false;
		}
	}

	return true;
}
