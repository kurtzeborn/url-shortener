import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getTableClient, ensureTableExists, responses } from '../utils';

/**
 * POST /api/click/:id
 * Increment click count for a shortened URL (called by Cloudflare Worker)
 * Internal API - requires X-Internal-Key header
 */
export async function clickTracker(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('X-Internal-Key');
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return responses.unauthorized('Invalid API key');
    }

    const id = request.params.id;
    if (!id) {
      return responses.badRequest('Missing ID parameter');
    }

    // Ensure tables exist
    await ensureTableExists('URLs');
    await ensureTableExists('UserURLs');

    // Get partition key
    const partitionKey = id.length >= 2 ? id.substring(0, 2) : id;

    // Update click count in URLs table
    const urlsClient = getTableClient('URLs');
    
    try {
      const entity = await urlsClient.getEntity(partitionKey, id);
      const currentCount = (entity.ClickCount as number) || 0;
      
      await urlsClient.updateEntity(
        {
          partitionKey,
          rowKey: id,
          ClickCount: currentCount + 1,
        },
        'Merge'
      );

      // Also update UserURLs table (denormalized)
      const owner = entity.Owner as string;
      if (owner) {
        const userUrlsClient = getTableClient('UserURLs');
        try {
          await userUrlsClient.updateEntity(
            {
              partitionKey: owner,
              rowKey: id,
              ClickCount: currentCount + 1,
            },
            'Merge'
          );
        } catch (err) {
          // Silently fail if UserURLs update fails
          context.log('Failed to update UserURLs:', err);
        }
      }

      return responses.ok({ success: true, clickCount: currentCount + 1 });
    } catch (error) {
      context.error('Error updating click count:', error);
      return responses.notFound('URL not found');
    }
  } catch (error) {
    context.error('Error in click tracker:', error);
    return responses.serverError('Failed to track click');
  }
}

app.http('click', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'click/{id}',
  handler: clickTracker,
});
