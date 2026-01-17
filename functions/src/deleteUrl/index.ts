import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getTableClient, ensureTableExists, getUrlPartitionKey, responses } from '../utils';

/**
 * DELETE /api/urls/:id
 * Delete a shortened URL
 */
export async function deleteUrl(
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

    // Ensure tables exist
    await ensureTableExists('URLs');
    await ensureTableExists('UserURLs');

    const partitionKey = getUrlPartitionKey(id);

    // Delete from URLs table
    const urlsClient = getTableClient('URLs');
    
    try {
      const entity = await urlsClient.getEntity(partitionKey, id);
      
      // Verify ownership
      if (entity.Owner !== userEmail) {
        return responses.forbidden('You do not own this URL');
      }

      await urlsClient.deleteEntity(partitionKey, id);

      // Delete from UserURLs table
      const userUrlsClient = getTableClient('UserURLs');
      await userUrlsClient.deleteEntity(userEmail, id);

      return responses.noContent();
    } catch (error) {
      return responses.notFound('URL not found');
    }
  } catch (error) {
    context.error('Error deleting URL:', error);
    return responses.serverError('Failed to delete URL');
  }
}

app.http('deleteUrl', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'urls/{id}',
  handler: deleteUrl,
});
