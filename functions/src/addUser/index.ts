import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getTableClient, isValidEmail, responses } from '../utils';

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
    // TODO: Get user from auth token
    const currentUserEmail = 'test@example.com'; // Placeholder until auth is implemented

    // Verify current user is allowed
    const allowedUsersClient = getTableClient('AllowedUsers');
    try {
      await allowedUsersClient.getEntity('users', currentUserEmail);
    } catch {
      return responses.forbidden('You are not authorized to add users');
    }

    // Parse request body
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email) {
      return responses.badRequest('Missing email field');
    }

    if (!isValidEmail(email)) {
      return responses.badRequest('Invalid email format');
    }

    // Check if email already exists
    try {
      await allowedUsersClient.getEntity('users', email);
      return responses.conflict('Email already exists in allowlist');
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
      return responses.forbidden('Daily invite limit reached (10 per day)');
    }

    // Add user to AllowedUsers
    const now = new Date().toISOString();
    await allowedUsersClient.createEntity({
      partitionKey: 'users',
      rowKey: email,
      AddedDate: now,
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
      email,
      addedDate: now,
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
  route: 'users/add',
  handler: addUser,
});
