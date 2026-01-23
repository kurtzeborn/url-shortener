import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getTableClient, ensureTableExists, isValidEmail, responses } from '../utils';
import { authenticateRequest } from '../auth';

/**
 * POST /api/users/add
 * Add a new user to the AllowedUsers list
 * Rate limited to 10 invites per user per day
 */
export async function addUser(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Authenticate and authorize the request
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.success) {
      return auth.response;
    }
    const currentUserEmail = auth.user.email;

    // Ensure tables exist
    await ensureTableExists('AllowedUsers');
    await ensureTableExists('UserInvites');

    // Get the AllowedUsers client
    const allowedUsersClient = getTableClient('AllowedUsers');

    // Parse request body
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email) {
      return responses.badRequest('Missing email field', 'MISSING_EMAIL');
    }

    if (!isValidEmail(email)) {
      return responses.badRequest('Invalid email format', 'INVALID_EMAIL');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    try {
      await allowedUsersClient.getEntity('users', normalizedEmail);
      return responses.conflict('Email already exists in allowlist', 'EMAIL_EXISTS');
    } catch {
      // Email doesn't exist - proceed
    }

    // Check rate limit
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userInvitesClient = getTableClient('UserInvites');
    
    let inviteCount = 0;
    try {
      const inviteEntity = await userInvitesClient.getEntity(currentUserEmail, today);
      inviteCount = (inviteEntity.InviteCount as number) || 0;
    } catch {
      // No invites today yet
    }

    if (inviteCount >= 10) {
      return responses.tooManyRequests('Daily invite limit reached (10 per day)', 'INVITE_LIMIT_REACHED');
    }

    // Add user to AllowedUsers
    const now = new Date().toISOString();
    await allowedUsersClient.createEntity({
      partitionKey: 'users',
      rowKey: normalizedEmail,
      AddedAt: now,
      AddedBy: currentUserEmail,
    });

    // Update/create invite count
    if (inviteCount === 0) {
      await userInvitesClient.createEntity({
        partitionKey: currentUserEmail,
        rowKey: today,
        InviteCount: 1,
      });
    } else {
      await userInvitesClient.updateEntity(
        {
          partitionKey: currentUserEmail,
          rowKey: today,
          InviteCount: inviteCount + 1,
        },
        'Merge'
      );
    }

    return responses.created({
      email: normalizedEmail,
      addedAt: now,
      addedBy: currentUserEmail,
      remainingInvites: 10 - (inviteCount + 1),
    });
  } catch (error) {
    context.error('Error adding user:', error);
    return responses.serverError('Failed to add user');
  }
}

app.http('addUser', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users',
  handler: addUser,
});
