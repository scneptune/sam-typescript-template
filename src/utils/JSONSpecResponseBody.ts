interface RawObject {
	id: string;
	[key: string]: any;
}

type RawObjectWithType = RawObject & { type: string };

export interface JSONAPIDataResponse {
	type: string;
	id: string;
	attributes: {
		[key: string]: any;
	};
	relationships?: {
		[key: string]: JSONAPIResponse;
	};
}

export interface JSONAPIResponse {
	data: JSONAPIDataResponse | JSONAPIDataResponse[];
	meta?: {
		[key: string]: any;
	};
}

/**
 * A class that transforms raw JavaScript Object data into JSON:API compliant responses.
 */
export default class JSONAPIResponseBody {
	private data: JSONAPIDataResponse | JSONAPIDataResponse[];
	private meta: JSONAPIResponse['meta'];
	private type: string;

	/**
	 * @description Creates a new instance of the JSONAPIResponseBody.
	 * @param type - The type of the input data.
	 * @param input - The raw data to be transformed.
	 * @param meta - Optional metadata, can be used for things like counts.
	 * @throws Will throw an error if the type is not a non-empty string.
	 * @example
	 * ```typescript
	 * const transformer = new JSONAPIResponseBody('user', { id: '1', name: 'John Doe' });
	 * ```
	 */
	constructor(
		type: string,
		input: RawObject | RawObject[],
		meta?: JSONAPIResponse['meta'],
	) {
		if (typeof type !== 'string' || type === '') {
			throw new Error('Invalid type provided: type must be a non-empty string');
		}
		this.type = type;
		this.meta = meta;
		if (Array.isArray(input)) {
			this.data = input.map((obj) => this.transformObject(obj));
			// doing this for consistency with the other formatting
			this.meta = Object.assign(meta ?? {}, { count: this.data.length });
		} else {
			this.data = this.transformObject(input);
		}
		return this;
	}

	/**
	 * @private
	 * @description Handles the processing of grouped relationships.
	 * @param relationship - The relationships to be processed.
	 * @throws Will throw an error if a relationship object does not have a 'type' attribute.
	 * @returns The processed relationships.
	 */
	private handleGroupedRelationships(relationship: RawObjectWithType[]) {
		return relationship.reduce(
			(accumulator, relationshipItem: RawObjectWithType) => {
				if (!relationshipItem.hasOwnProperty('type')) {
					throw new Error(
						"Each relationship object in the array of 'relationships' must have a 'type' attribute",
					);
				}
				const { type: inherentRelationType, ...relationshipAttributes } =
					relationshipItem;

				if (!accumulator.hasOwnProperty(inherentRelationType)) {
					return Object.assign(
						accumulator,
						this.processIndividualRelationship(relationshipItem),
					);
				}
				if (accumulator[inherentRelationType]?.data) {
					// handle adding to the data array if the relationship already exists
					if (!Array.isArray(accumulator[inherentRelationType].data)) {
						// transform the data object into an array, so we can push related objects to it
						// it should be ok to do this because, this would be the second occurance of a relationship
						// that has a matching inherentRelationType to one existing in the accumulator.
						accumulator[inherentRelationType].data = [
							accumulator[inherentRelationType].data,
						];
					}
					const formattedRelationship = new JSONAPIResponseBody(
						inherentRelationType,
						relationshipAttributes,
					).formatAsResponse();
					// push in the data into the array of related objects
					accumulator[inherentRelationType].data.push(
						formattedRelationship.data,
					);
					// include a meta with the count for consistency with the other relationship formatting
					// this also helps with knowing that a relationship is an array of objects.
					accumulator[inherentRelationType].meta = {
						count: accumulator[inherentRelationType].data.length,
					};
					return accumulator;
				}
				// handle adding the relationship if it doesn't already exist
				const formattedRelationship = new JSONAPIResponseBody(
					inherentRelationType,
					relationshipAttributes,
				).formatAsResponse();
				accumulator[inherentRelationType] = formattedRelationship;
				return accumulator;
			},
			{},
		);
	}

	/**
	 * @private
	 * @description Processes individual relationship objects.
	 * @param relationship - The relationship to be processed.
	 * @throws Will throw an error if a relationship object does not have a 'type' attribute.
	 * @returns The processed relationship.
	 */
	private processIndividualRelationship(relationship: RawObjectWithType) {
		if (!relationship.hasOwnProperty('type')) {
			throw new Error("Each relationship object must have a 'type' attribute");
		}
		const { type: inherentRelationType, ...relationshipAttributes } =
			relationship;
		const relationshipDataFormatted: JSONAPIResponse = new JSONAPIResponseBody(
			inherentRelationType,
			relationshipAttributes,
		).formatAsResponse();
		return {
			[`${inherentRelationType}`]: relationshipDataFormatted,
		};
	}

	/**
	 * @private
	 * @description Handles the processing of relationships.
	 * @param relationship - The relationships to be processed.
	 * @returns The processed relationships.
	 */
	private handleRelationships(
		relationship: RawObjectWithType | RawObjectWithType[],
	) {
		// all logic for formatting based on https://jsonapi.org/format/#fetching-resources-responses
		if (Array.isArray(relationship)) {
			const groupedRelations = this.handleGroupedRelationships(relationship);
			return groupedRelations;
		} else {
			return this.processIndividualRelationship(relationship);
		}
	}

	/**
	 * @private
	 * @description Transforms raw objects into JSON:API compliant data objects.
	 * @param obj - The raw object to be transformed.
	 * @throws Will throw an error if the object does not have an 'id' property.
	 * @returns The transformed object.
	 */
	private transformObject(obj: RawObject): JSONAPIDataResponse {
		// based on https://jsonapi.org/format/#fetching-resources-responses
		if (!obj.hasOwnProperty('id')) {
			throw new Error(
				'Invalid obj: object must have an id property in order to be transformed into a JSONAPIResponse',
			);
		}
		const { id, ...attributes } = obj;
		if (attributes.relationships) {
			const { relationships, ...attributesWithoutRelationships } = attributes;
			return {
				id,
				type: this.type,
				attributes: attributesWithoutRelationships,
				relationships: this.handleRelationships(relationships),
			};
		}
		return {
			id,
			type: this.type,
			attributes,
		};
	}

	/**
	 * @public
	 * @description Formats the transformed data into a JSON:API compliant response.
	 * @returns The JSON:API response.
	 * @example
	 * ```typescript
	 * const response = transformer.formatAsResponse();
	 * console.log(response);
	 * ```
	 */
	public formatAsResponse(): JSONAPIResponse {
		return {
			data: this.data,
			meta: this.meta,
		};
	}
}
