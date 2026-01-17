import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  getTableClient,
  ensureTableExists,
  generateId,
  isValidUrl,
  getUrlPartitionKey,
  responses,
  buildShortUrl,
  MAX_URL_LENGTH,
} from '../utils';
import { authenticateRequest } from '../auth';

/**
 * POST /api/urls
 * Create a new shortened URL
 */
export async function createUrl(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Authenticate and authorize the request
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.success) {
      return auth.response;
    }
    const userEmail = auth.user.email;

    // Parse request body
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url) {
      return responses.badRequest('Missing url field', 'MISSING_URL');
    }

    if (url.length > MAX_URL_LENGTH) {
      return responses.badRequest(`URL exceeds maximum length of ${MAX_URL_LENGTH} characters`, 'URL_TOO_LONG');
    }

    if (!isValidUrl(url)) {
      return responses.badRequest('Invalid URL format', 'INVALID_URL');
    }

    // Ensure tables exist
    await ensureTableExists('URLs');
    await ensureTableExists('UserURLs');

    // Generate unique ID (with collision retry)
    const urlsClient = getTableClient('URLs');
    let id: string = '';
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

    if (attempts >= maxAttempts || id === '') {
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
      CreatedAt: now,
      ClickCount: 0,
    });

    // Create entity in UserURLs table (denormalized for dashboard)
    const userUrlsClient = getTableClient('UserURLs');
    await userUrlsClient.createEntity({
      partitionKey: userEmail,
      rowKey: id,
      URL: url,
      CreatedAt: now,
      ClickCount: 0,
    });

    return responses.created({
      id,
      shortUrl: buildShortUrl(id),
      url,
      createdAt: now,
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
