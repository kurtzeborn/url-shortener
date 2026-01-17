import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getTableClient, responses } from '../utils';

/**
 * GET /api/urls
 * Get all URLs for the authenticated user (paginated, sortable, filterable)
 */
export async function getUrls(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // TODO: Get user from auth token
    const userEmail = 'test@example.com'; // Placeholder until auth is implemented

    // Parse query parameters
    const page = parseInt(request.query.get('page') || '1');
    const pageSize = parseInt(request.query.get('pageSize') || '10');
    const sortBy = request.query.get('sortBy') || 'date'; // 'date' or 'clicks'
    const sortOrder = request.query.get('sortOrder') || 'desc'; // 'asc' or 'desc'

    // Query UserURLs table for this user
    const client = getTableClient('UserURLs');
    const entities = client.listEntities({
      queryOptions: {
        filter: `PartitionKey eq '${userEmail}'`,
      },
    });

    // Collect all entities
    const urls: any[] = [];
    for await (const entity of entities) {
      urls.push({
        id: entity.rowKey,
        shortUrl: `https://k61.dev/${entity.rowKey}`,
        url: entity.URL,
        createdDate: entity.CreatedDate,
        clickCount: entity.ClickCount || 0,
      });
    }

    // Sort
    urls.sort((a, b) => {
      if (sortBy === 'clicks') {
        return sortOrder === 'asc' 
          ? a.clickCount - b.clickCount 
          : b.clickCount - a.clickCount;
      } else {
        // Sort by date
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUrls = urls.slice(startIndex, endIndex);

    return responses.ok({
      urls: paginatedUrls,
      page,
      pageSize,
      totalCount: urls.length,
      totalPages: Math.ceil(urls.length / pageSize),
    });
  } catch (error) {
    context.error('Error getting URLs:', error);
    return responses.serverError('Failed to get URLs');
  }
}

app.http('getUrls', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'urls',
  handler: getUrls,
});
