import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  getTableClient,
  generateId,
  isValidId,
  isValidUrl,
  getUrlPartitionKey,
  responses,
} from '../utils';

/**
 * POST /api/urls
 * Create a new shortened URL
 */
export async function createUrl(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // TODO: Get user from auth token
    const userEmail = 'test@example.com'; // Placeholder until auth is implemented

    // Parse request body
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url) {
      return responses.badRequest('Missing url field');
    }

    if (!isValidUrl(url)) {
      return responses.badRequest('Invalid URL format');
    }

    // Generate unique ID (with collision retry)
    const urlsClient = getTableClient('URLs');
    let id: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      id = generateId(4);
      const partitionKey = getUrlPartitionKey(id);

      try {
        // Check if ID already exists
        await urlsClient.getEntity(partitionKey, id);
        // If we get here, ID exists - try again
        attempts++;
      } catch {
        // ID doesn't exist - we can use it
        break;
      }
    }

    if (attempts >= maxAttempts) {
      return responses.serverError('Failed to generate unique ID');
    }

    const partitionKey = getUrlPartitionKey(id);
    const now = new Date().toISOString();

    // Create entity in URLs table
    await urlsClient.createEntity({
      partitionKey,
      rowKey: id,
      URL: url,
      Owner: userEmail,
      CreatedDate: now,
      ClickCount: 0,
    });

    // Create entity in UserURLs table (denormalized for dashboard)
    const userUrlsClient = getTableClient('UserURLs');
    await userUrlsClient.createEntity({
      partitionKey: userEmail,
      rowKey: id,
      URL: url,
      CreatedDate: now,
      ClickCount: 0,
    });

    return responses.created({
      id,
      shortUrl: `https://k61.dev/${id}`,
      url,
      createdDate: now,
      clickCount: 0,
    });
  } catch (error) {
    context.error('Error creating URL:', error);
    return responses.serverError('Failed to create shortened URL');
  }
}

app.http('createUrl', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'urls',
  handler: createUrl,
});
