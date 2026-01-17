import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { isUserAllowed } from '../auth';
import { responses } from '../utils';

/**
 * GET /api/auth/check
 * Check if a user email is in the AllowedUsers table
 * This is called after Microsoft login to verify access
 */
export async function checkAuth(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const email = request.query.get('email');

    if (!email) {
      return responses.badRequest('Missing email parameter', 'MISSING_EMAIL');
    }

    const allowed = await isUserAllowed(email);

    return responses.ok({ allowed, email: email.toLowerCase() });
  } catch (error) {
    context.error('Error checking auth:', error);
    return responses.serverError('Failed to check authorization');
  }
}

app.http('checkAuth', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/check',
  handler: checkAuth,
});
