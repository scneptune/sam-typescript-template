import DynamoDB from 'aws-sdk/clients/dynamodb';

export default class DynamoDbClient {
	table: string;
	partitionKey: string;
	docClient: DynamoDB.DocumentClient;

	constructor(table: string, partitionKey = null) {
		this.docClient = new DynamoDB.DocumentClient();
		this.table = table;
		if (partitionKey) {
			this.partitionKey = partitionKey;
		}
	}

	async readAll() {
		const data = await this.docClient.scan({ TableName: this.table }).promise();
		return data.Items;
	}

	async read(partitionId: string, sortKey: string) {
		if (!this.partitionKey) {
			throw new Error(
				'Partition key not set, please pass one into the constructor of this service',
			);
		}
		var params: DynamoDB.DocumentClient.GetItemInput = {
			TableName: this.table,
			Key: { [this.partitionKey]: partitionId, sortKey },
		};
		const data = await this.docClient.get(params).promise();
		return data.Item;
	}

	async write(Item: object) {
		const params = {
			TableName: this.table,
			Item,
		};

		const data = await this.docClient.put(params).promise();
		return data;
	}

	async update(params: DynamoDB.DocumentClient.UpdateItemInput) {
		const data = await this.docClient.update(params).promise();
		return data;
	}

	async query(params: any) {
		const data = await this.docClient.query(params).promise();
		return data;
	}
}
