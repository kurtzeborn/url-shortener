import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getTableClient, ensureTableExists, isValidUrl, getUrlPartitionKey, responses, buildShortUrl, MAX_URL_LENGTH } from '../utils';
import { authenticateRequest } from '../auth';

/**
 * PUT /api/urls/:id
 * Update the destination URL for a shortened URL
 */
export async function updateUrl(
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

    const id = request.params.id;
    if (!id) {
      return responses.badRequest('Missing ID parameter', 'MISSING_ID');
    }

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

    const partitionKey = getUrlPartitionKey(id);

    // Update URLs table
    const urlsClient = getTableClient('URLs');
    
    try {
      const entity = await urlsClient.getEntity(partitionKey, id);
      
      // Verify ownership
      if (entity.Owner !== userEmail) {
        return responses.forbidden('You do not own this URL', 'NOT_OWNER');
      }

      await urlsClient.updateEntity(
        {
          partitionKey,
          rowKey: id,
          URL: url,
        },
        'Merge'
      );

      // Update UserURLs table
      const userUrlsClient = getTableClient('UserURLs');
      await userUrlsClient.updateEntity(
        {
          partitionKey: userEmail,
          rowKey: id,
          URL: url,
        },
        'Merge'
      );

      return responses.ok({
        id,
        shortUrl: buildShortUrl(id),
        url,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return responses.notFound('URL not found', 'URL_NOT_FOUND');
    }
  } catch (error) {
    context.error('Error updating URL:', error);
    return responses.serverError('Failed to update URL');
  }
}

app.http('updateUrl', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'urls/{id}',
  handler: updateUrl,
});
