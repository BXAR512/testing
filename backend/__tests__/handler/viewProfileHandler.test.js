const ViewProfileHandler = require('../../handler/viewProfileHandler');
const PrivacyRequest = require('../../handler/privacyRequest');
const { PrismaClient } = require('../../generated/prisma');

// Mock the Prisma client
const mockPrisma = {
  userPrivacySettings: {
    findUnique: jest.fn(),
  },
  blockedUser: {
    findUnique: jest.fn(),
  },
  friend: {
    findFirst: jest.fn(),
  },
};

jest.mock('../../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('ViewProfileHandler', () => {
  let handler;
  let request;

  beforeEach(() => {
    handler = new ViewProfileHandler();
    request = new PrivacyRequest('user123', 'user456', 'view_profile', 'profile_viewing');
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create handler with view_profile action', () => {
      expect(handler.action).toBe('view_profile');
    });
  });

  describe('Self Request Handling', () => {
    test('should allow access for self request', async () => {
      const selfRequest = new PrivacyRequest('user123', 'user123', 'view_profile', 'profile_viewing');
      const mockUserData = { id: 'user123', name: 'John Doe', email: 'john@example.com' };
      
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockUserData);
      
      const result = await handler.processUserLevels(selfRequest);
      
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(true);
      expect(result.response.data).toEqual(mockUserData);
      expect(result.response.handler).toBe('ViewProfileHandler-Self');
    });
  });

  describe('Blocked User Handling', () => {
    test('should deny access when requester is blocked by target', async () => {
      mockPrisma.blockedUser.findUnique
        .mockResolvedValueOnce({ userId: 'user456', blockedUserId: 'user123' }) // blockedByTarget
        .mockResolvedValueOnce(null); // hasBlockedTarget
      
      const result = await handler.processUserLevels(request);
      
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(false);
      expect(result.response.reason).toBe('Access blocked');
      expect(result.response.handler).toBe('ViewProfileHandler-Blocked');
    });

    test('should deny access when requester has blocked target', async () => {
      mockPrisma.blockedUser.findUnique
        .mockResolvedValueOnce(null) // blockedByTarget
        .mockResolvedValueOnce({ userId: 'user123', blockedUserId: 'user456' }); // hasBlockedTarget
      
      const result = await handler.processUserLevels(request);
      
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(false);
      expect(result.response.reason).toBe('Access blocked');
      expect(result.response.handler).toBe('ViewProfileHandler-Blocked');
    });

    test('should continue processing when no blocking relationship exists', async () => {
      mockPrisma.blockedUser.findUnique
        .mockResolvedValueOnce(null) // blockedByTarget
        .mockResolvedValueOnce(null); // hasBlockedTarget
      
      const mockPrivacySettings = {
        id: 'user456',
        profileVisibility: 'public',
        isAnon: false
      };
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockPrivacySettings);
      
      const result = await handler.processUserLevels(request);
      
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(true);
    });
  });

  describe('User Not Found Handling', () => {
    test('should return user not found when privacy settings do not exist', async () => {
      mockPrisma.blockedUser.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(null);
      
      const result = await handler.processUserLevels(request);
      
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(false);
      expect(result.response.reason).toBe('User not found');
      expect(result.response.handler).toBe('ViewProfileHandler-NotFound');
    });
  });

  describe('Anonymous User Handling', () => {
    test('should return anonymous data when user is anonymous', async () => {
      const mockPrivacySettings = {
        id: 'user456',
        profileVisibility: 'public',
        isAnon: true,
        anonUsername: 'AnonymousUser123'
      };
      
      mockPrisma.blockedUser.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockPrivacySettings);
      
      const result = await handler.processUserLevels(request);
      
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(true);
      expect(result.response.isANon).toBe(true);
      expect(result.response.anonName).toBe('AnonymousUser123');
      expect(result.response.data).toEqual({
        id: 'user456',
        usernam: 'AnonymousUser123',
        isAnone: true
      });
      expect(result.response.handler).toBe('ViewProfileHandler-Anonymous');
    });

    test('should use default anonymous username when not provided', async () => {
      const mockPrivacySettings = {
        id: 'user456',
        profileVisibility: 'public',
        isAnon: true,
        anonUsername: null
      };
      
      mockPrisma.blockedUser.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockPrivacySettings);
      
      const result = await handler.processUserLevels(request);
      
      expect(result.response.data.usernam).toBe('Anonymous User');
    });
  });

  describe('Profile Visibility Levels', () => {
    describe('Public Profile', () => {
      test('should allow access to public profile', async () => {
        const mockPrivacySettings = {
          id: 'user456',
          profileVisibility: 'public',
          isAnon: false
        };
        const mockUserData = { id: 'user456', name: 'Jane Doe', email: 'jane@example.com' };
        
        mockPrisma.blockedUser.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);
        mockPrisma.userPrivacySettings.findUnique
          .mockResolvedValueOnce(mockPrivacySettings) // getPrivacySettings
          .mockResolvedValueOnce(mockUserData); // getUserData
        
        const result = await handler.processUserLevels(request);
        
        expect(result.handled).toBe(true);
        expect(result.response.allowed).toBe(true);
        expect(result.response.data).toEqual(mockUserData);
        expect(result.response.handler).toBe('ViewProfileHandler-Public');
      });
    });

    describe('Friend Only Profile', () => {
      test('should allow access when users are friends', async () => {
        const mockPrivacySettings = {
          id: 'user456',
          profileVisibility: 'friend_only',
          isAnon: false
        };
        const mockUserData = { id: 'user456', name: 'Jane Doe', email: 'jane@example.com' };
        
        mockPrisma.blockedUser.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);
        mockPrisma.userPrivacySettings.findUnique
          .mockResolvedValueOnce(mockPrivacySettings)
          .mockResolvedValueOnce(mockUserData);
        mockPrisma.friend.findFirst.mockResolvedValue({
          user_id: 'user123',
          friend_id: 'user456',
          status: 'accepted'
        });
        
        const result = await handler.processUserLevels(request);
        
        expect(result.handled).toBe(true);
        expect(result.response.allowed).toBe(true);
        expect(result.response.data).toEqual(mockUserData);
        expect(result.response.handler).toBe('ViewProfileHandler-Friends');
      });

      test('should deny access when users are not friends', async () => {
        const mockPrivacySettings = {
          id: 'user456',
          profileVisibility: 'friend_only',
          isAnon: false
        };
        
        mockPrisma.blockedUser.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);
        mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockPrivacySettings);
        mockPrisma.friend.findFirst.mockResolvedValue(null);
        
        const result = await handler.processUserLevels(request);
        
        expect(result.handled).toBe(true);
        expect(result.response.allowed).toBe(true);
        expect(result.response.data).toBe('Access denied');
        expect(result.response.handler).toBe('ViewProfileHandler-Default');
      });
    });

    describe('Private Profile', () => {
      test('should deny access to private profile', async () => {
        const mockPrivacySettings = {
          id: 'user456',
          profileVisibility: 'private',
          isAnon: false
        };
        
        mockPrisma.blockedUser.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);
        mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockPrivacySettings);
        
        const result = await handler.processUserLevels(request);
        
        expect(result.handled).toBe(true);
        expect(result.response.allowed).toBe(true);
        expect(result.response.data).toBe('Profile is private');
        expect(result.response.handler).toBe('ViewProfileHandler-Private');
      });
    });
  });

  describe('Database Methods', () => {
    test('getUserData should call prisma with correct parameters', async () => {
      const mockUserData = { id: 'user123', name: 'John' };
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockUserData);
      
      const result = await handler.getUserData('user123');
      
      expect(mockPrisma.userPrivacySettings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
      expect(result).toEqual(mockUserData);
    });

    test('getPrivacySettings should call prisma with correct parameters', async () => {
      const mockSettings = { id: 'user123', profileVisibility: 'public' };
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockSettings);
      
      const result = await handler.getPrivacySettings('user123');
      
      expect(mockPrisma.userPrivacySettings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
      expect(result).toEqual(mockSettings);
    });

    test('checkBlockedStatus should return true when blocked', async () => {
      mockPrisma.blockedUser.findUnique
        .mockResolvedValueOnce({ userId: 'user456', blockedUserId: 'user123' })
        .mockResolvedValueOnce(null);
      
      const result = await handler.checkBlockedStatus(request);
      
      expect(result).toBe(true);
    });

    test('checkBlockedStatus should return false when not blocked', async () => {
      mockPrisma.blockedUser.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      const result = await handler.checkBlockedStatus(request);
      
      expect(result).toBe(false);
    });

    test('checkFriendship should return true when friends', async () => {
      mockPrisma.friend.findFirst.mockResolvedValue({
        user_id: 'user123',
        friend_id: 'user456',
        status: 'accepted'
      });
      
      const result = await handler.checkFriendship(request);
      
      expect(result).toBe(true);
      expect(mockPrisma.friend.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              user_id: 'user123',
              friend_id: 'user456',
              status: 'accepted',
            },
            {
              user_id: 'user456',
              friend_id: 'user123',
              status: 'accepted',
            },
          ],
        },
      });
    });

    test('checkFriendship should return false when not friends', async () => {
      mockPrisma.friend.findFirst.mockResolvedValue(null);
      
      const result = await handler.checkFriendship(request);
      
      expect(result).toBe(false);
    });
  });
}); 