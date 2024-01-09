import DynamoDB from 'aws-sdk/clients/dynamodb';
import SecretsManagerService from './SecretsManagerService';
import { QueryOutput, QueryInput } from '@aws-sdk/client-dynamodb';

export default class DynamoDbClient {
	table: string;
	partitionKey: string;
	docClient: DynamoDB.DocumentClient;
	secretsManager: SecretsManagerService;

	constructor(table: string, partitionKey = null) {
		this.docClient = new DynamoDB.DocumentClient();
		this.secretsManager = SecretsManagerService.getInstance();
		this.table = table;
		if (partitionKey) {
			this.partitionKey = partitionKey;
		}
	}

	async init() {
		const { STUDENTS_TABLE_ID } = await this.secretsManager.getSharedSecrets();
		this.table = STUDENTS_TABLE_ID ?? 'llp_students';
		return STUDENTS_TABLE_ID;
	}

	async readAll() {
		await this.init();
		const data = await this.docClient.scan({ TableName: this.table }).promise();
		return data.Items;
	}

	async read(partitionId: string, sortKey: string) {
		if (!this.partitionKey) {
			throw new Error(
				'Partition key not set, please pass one into the constructor of this service',
			);
		}
		await this.init();
		var params: DynamoDB.DocumentClient.GetItemInput = {
			TableName: this.table,
			Key: { [this.partitionKey]: partitionId, sortKey },
		};
		const data = await this.docClient.get(params).promise();
		return data.Item;
	}

	async write(Item: object) {
		await this.init();
		const params = {
			TableName: this.table,
			Item,
		};

		const data = await this.docClient.put(params).promise();
		return data;
	}

	async update(params: DynamoDB.DocumentClient.UpdateItemInput) {
		await this.init();

		const data = await this.docClient
			.update({ ...params, TableName: this.table })
			.promise();
		return data;
	}

	async query(params: any) {
		await this.init();
		const data = await this.docClient
			.query({ ...params, TableName: this.table })
			.promise();
		return data;
	}

	async queryAll(params: any) {
		await this.init();
		let lastEvaluatedKey = undefined;
		let allData: any = {
			Items: [],
			Count: 0,
			ScannedCount: 0,
			LastEvaluatedKey: lastEvaluatedKey,
		};

		do {
			const queryInput: QueryInput = {
				...params,
				TableName: this.table,
				ExclusiveStartKey: lastEvaluatedKey,
			};
			const data = await this.docClient.query(queryInput).promise();
			// Concatenate new items
			if (data.Items && allData.Items.length > 0) {
				allData.Items = [...allData.Items, ...data.Items];
				allData.Count += data.Count;
				allData.ScannedCount += data.ScannedCount;
				allData.LastEvaluatedKey = data.LastEvaluatedKey;
			} else {
				allData = data;
			}

			lastEvaluatedKey = data.LastEvaluatedKey;
		} while (lastEvaluatedKey);

		return allData;
	}
}
