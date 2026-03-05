import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import * as crypto from 'crypto';
import FormData from 'form-data';

export class OcrDocumentScanner implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OCR Document Scanner 1',
		name: 'ocrDocumentScanner',
		icon: { light: 'file:ocrDocumentScanner.svg', dark: 'file:ocrDocumentScanner.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: 'Scan Document',
		description: 'Interact with the OCR Document Scanner API',
		defaults: {
			name: 'OCR Document Scanner',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'ocrDocumentScannerApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Document Type',
				name: 'documentType',
				type: 'options',
				options: [
					{ name: 'Receipt', value: 'receipt' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Passport', value: 'passport' },
				],
				default: 'receipt',
				required: true,
			},
			{
				displayName: 'AI Model',
				name: 'aiModel',
				type: 'options',
				options: [
					{ name: 'Gemini', value: 'gemini' },
					{ name: 'OpenAI', value: 'openai' },
				],
				default: 'gemini',
				required: true,
			},
			{
				displayName: 'Document Description',
				name: 'docDescription',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the custom document',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'file',
				required: true,
				description: 'Name of the field that contains the binary file data to be submitted',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('ocrDocumentScannerApi');

		if (!credentials?.apiKey || !credentials?.secretKey || !credentials?.baseUrl) {
			throw new NodeOperationError(this.getNode(), 'No valid credentials found (missing API Key, Secret Key, or Base URL)!');
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const item = items[i];

				// Fetch details from the input item's JSON payload instead of node properties
				const documentType = (item.json.documentType as string) || 'receipt';
				const aiModel = (item.json.aiModel as string) || 'gemini';
				const docDescription = (item.json.docDescription as string) || '';

				const binaryPropertyName = 'file';
				if (item.binary === undefined || item.binary[binaryPropertyName] === undefined) {
					throw new NodeOperationError(this.getNode(), `No binary data property "${binaryPropertyName}" found on current item.`);
				}

				const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
				const fileBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

				// Prepare HMAC Signature
				const timestamp = Date.now().toString();
				const signaturePayload = `POST::/v1/scan/document::${timestamp}::`;

				const hmac = crypto.createHmac('sha256', credentials.secretKey as string);
				hmac.update(signaturePayload);
				const signature = hmac.digest('hex');

				// Multipart Form Data
				const formData = new FormData();
				formData.append('documentType', documentType);
				formData.append('aiModel', aiModel);
				formData.append('docDescription', docDescription);
				formData.append('file', fileBuffer, {
					filename: binaryData.fileName || 'document.pdf',
					contentType: binaryData.mimeType,
				});

				// Combine baseUrl with endpoint path. Ensure no double slashes.
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
				const url = `${baseUrl}/v1/scan/document`;

				const response = await fetch(url, {
					method: 'POST',
					headers: {
						'x-api-key': credentials.apiKey as string,
						'x-timestamp': timestamp,
						'x-signature': signature,
						...formData.getHeaders(),
					},
					body: formData.getBuffer(),
				});

				const responseData: any = await response.json();

				returnData.push({
					json: responseData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
