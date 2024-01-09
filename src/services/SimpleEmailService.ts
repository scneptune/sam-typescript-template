import {
	SESClient,
	SendEmailCommand,
	SendTemplatedEmailCommand,
} from '@aws-sdk/client-ses';
import type {
	SendEmailCommandInput,
	SendTemplatedEmailCommandInput,
} from '@aws-sdk/client-ses';
import htmlNodeParser from 'node-html-parser';
import SecretsManagerService from './SecretsManagerService';

const SES_CONFIGURATION_SET_NAME = 'lessons';

export default class SimpleEmailService {
	private clientInstance: SESClient;
	private secretsManager: SecretsManagerService;
	private sender: string;
	private sharedSecrets: Record<string, any>;
	constructor() {
		this.secretsManager = SecretsManagerService.getInstance();
		this.clientInstance = new SESClient({
			apiVersion: '2010-12-01',
			region: 'us-west-2',
			maxAttempts: 5,
			logger: console,
		});
	}

	public setSender(sender: string) {
		this.sender = sender;
	}
	async init() {
		const fetchedSharedSecrets = await this.secretsManager.getSharedSecrets();
		this.sharedSecrets = fetchedSharedSecrets;
		if (typeof this.sender === 'undefined' && this.sharedSecrets?.SES_SENDER) {
			this.setSender(this.sharedSecrets?.SES_SENDER);
		}

		return this;
	}
	buildEmailParams(to: string[], mergingParams: any) {
		return {
			Source: this.sender,
			Destination: {
				ToAddresses: to,
			},
			ConfigurationSetName: SES_CONFIGURATION_SET_NAME,
			...mergingParams,
		};
	}
	async sendEmail(to: string[], subject: string, html?: string, text?: string) {
		await this.init();
		const params: SendEmailCommandInput = this.buildEmailParams(to, {
			Message: {
				Subject: {
					Charset: 'UTF-8',
					Data: subject,
				},
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: html,
					},
					Text: {
						Charset: 'UTF-8',
						Data: text ?? htmlNodeParser(html).firstChild.innerText,
					},
				},
			},
		});
		console.info(JSON.stringify({ params }, null, 2));
		const emailSendCommand = new SendEmailCommand(params);
		const emailSendRespond = await this.clientInstance.send(emailSendCommand);
		return emailSendRespond;
	}
	async sendTemplateEmail(
		to: string[],
		templateName: string,
		templateData: Record<string, any>,
	) {
		await this.init();
		const params: SendTemplatedEmailCommandInput = this.buildEmailParams(to, {
			ConfigurationSetName: SES_CONFIGURATION_SET_NAME,
			Template: templateName,
			TemplateData: JSON.stringify({
				...templateData,
				// injectScript is just a placeholder to allow us to load scripts for
				// livereloading when in development using the email express previewer.
				injectScript: '',
			}),
		});
		console.info(JSON.stringify({ params }, null, 2));
		const emailSendCommand = new SendTemplatedEmailCommand(params);
		const emailSendRespond = await this.clientInstance.send(emailSendCommand);
		return emailSendRespond;
	}
}
