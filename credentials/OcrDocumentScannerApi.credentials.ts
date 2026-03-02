import { ICredentialType, INodeProperties } from 'n8n-workflow';

// eslint-disable-next-line @n8n/community-nodes/credential-test-required, @n8n/community-nodes/icon-validation
export class OcrDocumentScannerApi implements ICredentialType {
    name = 'ocrDocumentScannerApi';
    displayName = 'OCR Document Scanner API';
    // You can replace this with your actual documentation URL
    documentationUrl = 'https://github.com/codeedoc-com/n8n-nodes-ocr-document-scanner';
    properties: INodeProperties[] = [
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: '',
            required: true,
            description: 'The Base URL for the Document Scan API',
        },
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
            description: 'The API Key for the Document Scan API',
        },
        {
            displayName: 'Secret Key',
            name: 'secretKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
            description: 'The Secret Key used to generate the HMAC signature',
        },
    ];
}
