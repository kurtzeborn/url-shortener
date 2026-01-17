/**
 * Unit tests for authentication utilities
 */

import * as jwt from 'jsonwebtoken';
import { 
  getUserFromAuthHeader, 
  isUserAllowed, 
  getAllowedUserInfo,
  authenticateRequest,
  validateToken,
  DecodedToken 
} from './auth';
import * as utils from './utils';

// Mock the jsonwebtoken module
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock the jwks-rsa module
jest.mock('jwks-rsa', () => {
  return jest.fn().mockImplementation(() => ({
    getSigningKey: jest.fn((kid, callback) => {
      callback(null, { getPublicKey: () => 'mock-public-key' });
    }),
  }));
});

// Mock the utils module for table operations
jest.mock('./utils', () => ({
  getTableClient: jest.fn(),
  ensureTableExists: jest.fn().mockResolvedValue(undefined),
}));

const mockedUtils = utils as jest.Mocked<typeof utils>;

describe('getUserFromAuthHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for missing auth header', async () => {
    const result = await getUserFromAuthHeader(null);
    expect(result).toBeNull();
  });

  it('returns null for empty auth header', async () => {
    const result = await getUserFromAuthHeader('');
    expect(result).toBeNull();
  });

  it('returns null for non-Bearer auth header', async () => {
    const result = await getUserFromAuthHeader('Basic abc123');
    expect(result).toBeNull();
  });

  it('returns null for malformed Bearer header', async () => {
    const result = await getUserFromAuthHeader('Bearer');
    expect(result).toBeNull();
  });

  it('extracts token and validates it', async () => {
    const mockPayload = {
      email: 'user@example.com',
      name: 'Test User',
      oid: 'user-oid',
      sub: 'user-sub',
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(null, mockPayload);
    });

    const result = await getUserFromAuthHeader('Bearer valid-token');
    
    expect(result).toEqual({
      email: 'user@example.com',
      name: 'Test User',
      oid: 'user-oid',
      sub: 'user-sub',
    });
  });

  it('returns null when token validation fails', async () => {
    mockedJwt.decode.mockReturnValue(null);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await getUserFromAuthHeader('Bearer invalid-token');
    
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe('validateToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid token format', async () => {
    mockedJwt.decode.mockReturnValue(null);

    await expect(validateToken('invalid')).rejects.toThrow('Invalid token format');
  });

  it('rejects token with invalid issuer', async () => {
    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: { iss: 'https://evil.com/v2.0' },
    } as any);

    await expect(validateToken('token')).rejects.toThrow('Invalid token issuer');
  });

  it('rejects token with missing issuer', async () => {
    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: {},
    } as any);

    await expect(validateToken('token')).rejects.toThrow('Invalid token issuer');
  });

  it('rejects token without v2.0 suffix in issuer', async () => {
    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: { iss: 'https://login.microsoftonline.com/tenant-id' },
    } as any);

    await expect(validateToken('token')).rejects.toThrow('Invalid token issuer');
  });

  it('accepts valid Microsoft issuer format', async () => {
    const mockPayload = {
      email: 'user@example.com',
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(null, mockPayload);
    });

    const result = await validateToken('valid-token');
    expect(result.email).toBe('user@example.com');
  });

  it('extracts email from preferred_username if email not present', async () => {
    const mockPayload = {
      preferred_username: 'user@outlook.com',
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(null, mockPayload);
    });

    const result = await validateToken('valid-token');
    expect(result.email).toBe('user@outlook.com');
  });

  it('extracts email from upn if email and preferred_username not present', async () => {
    const mockPayload = {
      upn: 'user@company.onmicrosoft.com',
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(null, mockPayload);
    });

    const result = await validateToken('valid-token');
    expect(result.email).toBe('user@company.onmicrosoft.com');
  });

  it('rejects token with no email claim', async () => {
    const mockPayload = {
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
      name: 'User without email',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(null, mockPayload);
    });

    await expect(validateToken('valid-token')).rejects.toThrow('No email claim found in token');
  });

  it('lowercases email address', async () => {
    const mockPayload = {
      email: 'USER@EXAMPLE.COM',
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(null, mockPayload);
    });

    const result = await validateToken('valid-token');
    expect(result.email).toBe('user@example.com');
  });

  it('rejects when jwt.verify returns error', async () => {
    const mockPayload = {
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    const expiredError = new Error('jwt expired') as jwt.VerifyErrors;
    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(expiredError, undefined);
    });

    await expect(validateToken('expired-token')).rejects.toThrow('jwt expired');
  });
});

describe('isUserAllowed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when user exists in AllowedUsers table', async () => {
    const mockGetEntity = jest.fn().mockResolvedValue({ partitionKey: 'users', rowKey: 'user@example.com' });
    mockedUtils.getTableClient.mockReturnValue({ getEntity: mockGetEntity } as any);

    const result = await isUserAllowed('user@example.com');
    
    expect(result).toBe(true);
    expect(mockedUtils.ensureTableExists).toHaveBeenCalledWith('AllowedUsers');
    expect(mockGetEntity).toHaveBeenCalledWith('users', 'user@example.com');
  });

  it('returns false when user does not exist', async () => {
    const mockGetEntity = jest.fn().mockRejectedValue(new Error('Entity not found'));
    mockedUtils.getTableClient.mockReturnValue({ getEntity: mockGetEntity } as any);

    const result = await isUserAllowed('unknown@example.com');
    
    expect(result).toBe(false);
  });

  it('lowercases email for lookup', async () => {
    const mockGetEntity = jest.fn().mockResolvedValue({});
    mockedUtils.getTableClient.mockReturnValue({ getEntity: mockGetEntity } as any);

    await isUserAllowed('USER@EXAMPLE.COM');
    
    expect(mockGetEntity).toHaveBeenCalledWith('users', 'user@example.com');
  });
});

describe('getAllowedUserInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user info when user exists', async () => {
    const mockEntity = {
      partitionKey: 'users',
      rowKey: 'user@example.com',
      AddedDate: '2026-01-15T10:00:00Z',
      AddedBy: 'admin@example.com',
    };
    const mockGetEntity = jest.fn().mockResolvedValue(mockEntity);
    mockedUtils.getTableClient.mockReturnValue({ getEntity: mockGetEntity } as any);

    const result = await getAllowedUserInfo('user@example.com');
    
    expect(result).toEqual({
      addedDate: '2026-01-15T10:00:00Z',
      addedBy: 'admin@example.com',
    });
  });

  it('returns null when user does not exist', async () => {
    const mockGetEntity = jest.fn().mockRejectedValue(new Error('Entity not found'));
    mockedUtils.getTableClient.mockReturnValue({ getEntity: mockGetEntity } as any);

    const result = await getAllowedUserInfo('unknown@example.com');
    
    expect(result).toBeNull();
  });

  it('lowercases email for lookup', async () => {
    const mockGetEntity = jest.fn().mockResolvedValue({ AddedDate: '', AddedBy: '' });
    mockedUtils.getTableClient.mockReturnValue({ getEntity: mockGetEntity } as any);

    await getAllowedUserInfo('USER@EXAMPLE.COM');
    
    expect(mockGetEntity).toHaveBeenCalledWith('users', 'user@example.com');
  });
});

describe('authenticateRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for missing auth header', async () => {
    const result = await authenticateRequest(null);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(401);
      expect(JSON.parse(result.response.body)).toEqual({
        error: { code: 'INVALID_TOKEN', message: 'Invalid or missing authentication token' },
      });
    }
  });

  it('returns 401 for invalid token', async () => {
    mockedJwt.decode.mockReturnValue(null);

    const result = await authenticateRequest('Bearer invalid');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns 403 for valid token but unauthorized user', async () => {
    const mockPayload = {
      email: 'unauthorized@example.com',
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(null, mockPayload);
    });

    const mockGetEntity = jest.fn().mockRejectedValue(new Error('Not found'));
    mockedUtils.getTableClient.mockReturnValue({ getEntity: mockGetEntity } as any);

    const result = await authenticateRequest('Bearer valid-token');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(403);
      expect(JSON.parse(result.response.body)).toEqual({
        error: { code: 'USER_NOT_ALLOWED', message: 'User not authorized to access this application' },
      });
    }
  });

  it('returns success with user for valid token and authorized user', async () => {
    const mockPayload = {
      email: 'allowed@example.com',
      name: 'Allowed User',
      iss: 'https://login.microsoftonline.com/tenant-id/v2.0',
    };

    mockedJwt.decode.mockReturnValue({
      header: { kid: 'key-id', alg: 'RS256' },
      payload: mockPayload,
    } as any);

    mockedJwt.verify.mockImplementation((token, getKey, options, callback) => {
      (callback as jwt.VerifyCallback)(null, mockPayload);
    });

    const mockGetEntity = jest.fn().mockResolvedValue({ rowKey: 'allowed@example.com' });
    mockedUtils.getTableClient.mockReturnValue({ getEntity: mockGetEntity } as any);

    const result = await authenticateRequest('Bearer valid-token');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.email).toBe('allowed@example.com');
      expect(result.user.name).toBe('Allowed User');
    }
  });

  it('returns proper Content-Type header on error responses', async () => {
    const result = await authenticateRequest(null);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.headers['Content-Type']).toBe('application/json');
    }
  });
});
