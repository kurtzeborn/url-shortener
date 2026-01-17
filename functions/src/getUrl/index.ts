import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getTableClient, ensureTableExists, getUrlPartitionKey, responses, buildShortUrl } from '../utils';
import { authenticateRequest } from '../auth';

/**
 * GET /api/urls/:id
 * Get details of a single shortened URL
 */
export async function getUrl(
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

    // Ensure table exists
    await ensureTableExists('URLs');

    const partitionKey = getUrlPartitionKey(id);
    const urlsClient = getTableClient('URLs');

    try {
      const entity = await urlsClient.getEntity(partitionKey, id);

      // Verify ownership
      if (entity.Owner !== userEmail) {
        return responses.forbidden('You do not own this URL', 'NOT_OWNER');
      }

      return responses.ok({
        id,
        shortUrl: buildShortUrl(id),
        url: entity.URL,
        createdAt: entity.CreatedAt || entity.CreatedDate,
        clickCount: entity.ClickCount || 0,
      });
    } catch (error) {
      return responses.notFound('URL not found', 'URL_NOT_FOUND');
    }
  } catch (error) {
    context.error('Error getting URL:', error);
    return responses.serverError('Failed to get URL');
  }
}

app.http('getUrl', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'urls/{id}',
  handler: getUrl,
});
