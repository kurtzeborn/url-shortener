import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getTableClient, ensureTableExists, isValidUrl, getUrlPartitionKey, responses } from '../utils';

/**
 * PUT /api/urls/:id
 * Update the destination URL for a shortened URL
 */
export async function updateUrl(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // TODO: Get user from auth token
    const userEmail = 'test@example.com'; // Placeholder until auth is implemented

    const id = request.params.id;
    if (!id) {
      return responses.badRequest('Missing ID parameter');
    }

    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url) {
      return responses.badRequest('Missing url field');
    }

    if (!isValidUrl(url)) {
      return responses.badRequest('Invalid URL format');
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
        return responses.forbidden('You do not own this URL');
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
        shortUrl: `https://k61.dev/${id}`,
        url,
        updatedDate: new Date().toISOString(),
      });
    } catch (error) {
      return responses.notFound('URL not found');
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
