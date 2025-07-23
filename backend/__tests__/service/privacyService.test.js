const PrivacyService = require('../../service/privacyService');
const { PrismaClient } = require('../../generated/prisma');

// Mock the Prisma client
const mockPrisma = {
  userPrivacySettings: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  blockedUser: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  friend: {
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('PrivacyService', () => {
  let privacyService;

  beforeEach(() => {
    privacyService = new PrivacyService();
    jest.clearAllMocks();
  });

  describe('createPrivacySettings', () => {
    test('should create privacy settings with default values', async () => {
      const userId = 'user123';
      const mockSettings = {
        id: 'settings123',
        userId,
        profileVisibility: 'friends_only',
        friendVisibility: 'friend_only',
        eventVisibility: 'friend_only',
        isAnon: false,
        anonUsername: null,
      };

      mockPrisma.userPrivacySettings.create.mockResolvedValue(mockSettings);

      const result = await privacyService.createPrivacySettings(userId);

      expect(mockPrisma.userPrivacySettings.create).toHaveBeenCalledWith({
        data: {
          userId,
          profileVisibility: 'friends_only',
          friendVisibility: 'friend_only',
          eventVisibility: 'friend_only',
          isAnon: false,
          anonUsername: null,
        },
      });
      expect(result).toEqual(mockSettings);
    });

    test('should create privacy settings with custom values', async () => {
      const userId = 'user123';
      const customSettings = {
        profileVisibility: 'public',
        isAnon: true,
        anonUsername: 'AnonymousUser',
      };
      const mockSettings = { id: 'settings123', userId, ...customSettings };

      mockPrisma.userPrivacySettings.create.mockResolvedValue(mockSettings);

      const result = await privacyService.createPrivacySettings(userId, customSettings);

      expect(mockPrisma.userPrivacySettings.create).toHaveBeenCalledWith({
        data: {
          userId,
          profileVisibility: 'public',
          friendVisibility: 'friend_only',
          eventVisibility: 'friend_only',
          isAnon: true,
          anonUsername: 'AnonymousUser',
        },
      });
      expect(result).toEqual(mockSettings);
    });

    test('should handle errors gracefully', async () => {
      const userId = 'user123';
      const error = new Error('Database error');
      mockPrisma.userPrivacySettings.create.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await privacyService.createPrivacySettings(userId);

      expect(consoleSpy).toHaveBeenCalledWith('Error creating settings:', error);
      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('getPrivacySettings', () => {
    test('should return privacy settings for user', async () => {
      const userId = 'user123';
      const mockSettings = {
        id: 'settings123',
        userId,
        profileVisibility: 'public',
        isAnon: false,
      };

      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(mockSettings);

      const result = await privacyService.getPrivacySettings(userId);

      expect(mockPrisma.userPrivacySettings.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual(mockSettings);
    });

    test('should handle errors gracefully', async () => {
      const userId = 'user123';
      const error = new Error('Database error');
      mockPrisma.userPrivacySettings.findUnique.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await privacyService.getPrivacySettings(userId);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting settings', error);
      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('updatePrivacySettings', () => {
    test('should update privacy settings', async () => {
      const userId = 'user123';
      const updateData = { profileVisibility: 'private' };
      const mockUpdatedSettings = {
        id: 'settings123',
        userId,
        profileVisibility: 'private',
        isAnon: false,
      };

      mockPrisma.userPrivacySettings.update.mockResolvedValue(mockUpdatedSettings);

      const result = await privacyService.updatePrivacySettings(userId, updateData);

      expect(mockPrisma.userPrivacySettings.update).toHaveBeenCalledWith({
        where: { userId },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedSettings);
    });

    test('should handle errors gracefully', async () => {
      const userId = 'user123';
      const updateData = { profileVisibility: 'private' };
      const error = new Error('Database error');
      mockPrisma.userPrivacySettings.update.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await privacyService.updatePrivacySettings(userId, updateData);

      expect(consoleSpy).toHaveBeenCalledWith('Error updating privacy settings ', error);
      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('blockUser', () => {
    test('should block user successfully', async () => {
      const userId = 'user123';
      const userToBlockId = 'user456';
      const mockBlockedUser = {
        userId,
        blockedUserId: userToBlockId,
      };

      mockPrisma.blockedUser.findUnique.mockResolvedValue(null); // Not already blocked
      mockPrisma.blockedUser.create.mockResolvedValue(mockBlockedUser);
      mockPrisma.friend.deleteMany.mockResolvedValue({ count: 1 });

      const result = await privacyService.blockUser(userId, userToBlockId);

      expect(mockPrisma.blockedUser.create).toHaveBeenCalledWith({
        data: {
          userId,
          blockedUserId: userToBlockId,
        },
      });
      expect(mockPrisma.friend.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { user_id: userId, friend_id: userToBlockId },
            { user_id: userToBlockId, friend_id: userId },
          ],
        },
      });
      expect(result).toEqual({
        message: 'User Blocked successfully',
        blockedUser: mockBlockedUser,
      });
    });

    test('should throw error if user is already blocked', async () => {
      const userId = 'user123';
      const userToBlockId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue({ userId, blockedUserId: userToBlockId });

      const result = await privacyService.blockUser(userId, userToBlockId);

      expect(mockPrisma.blockedUser.create).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    test('should handle errors gracefully', async () => {
      const userId = 'user123';
      const userToBlockId = 'user456';
      const error = new Error('Database error');
      mockPrisma.blockedUser.findUnique.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await privacyService.blockUser(userId, userToBlockId);

      expect(consoleSpy).toHaveBeenCalledWith('Error blocking user: ', error);
      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('unblockUser', () => {
    test('should unblock user successfully', async () => {
      const userId = 'user123';
      const userToUnblockId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue({ userId, blockedUserId: userToUnblockId });
      mockPrisma.blockedUser.delete.mockResolvedValue({ userId, blockedUserId: userToUnblockId });

      const result = await privacyService.unblockUser(userId, userToUnblockId);

      expect(mockPrisma.blockedUser.delete).toHaveBeenCalledWith({
        where: {
          userId_blockedUserId: {
            userId,
            blockedUserId: userToUnblockId,
          },
        },
      });
      expect(result).toEqual({
        message: 'User unblocked successfully',
      });
    });

    test('should throw error if user is not blocked', async () => {
      const userId = 'user123';
      const userToUnblockId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);

      const result = await privacyService.unblockUser(userId, userToUnblockId);

      expect(mockPrisma.blockedUser.delete).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('getBlockedUsers', () => {
    test('should return list of blocked users', async () => {
      const userId = 'user123';
      const mockBlockedUsers = [
        {
          blockedUser: { id: 'user456', username: 'blocked1', role: 'user' },
        },
        {
          blockedUser: { id: 'user789', username: 'blocked2', role: 'user' },
        },
      ];

      mockPrisma.blockedUser.findMany.mockResolvedValue(mockBlockedUsers);

      const result = await privacyService.getBlockedUsers(userId);

      expect(mockPrisma.blockedUser.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          blockedUser: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });
      expect(result).toEqual([
        { id: 'user456', username: 'blocked1', role: 'user' },
        { id: 'user789', username: 'blocked2', role: 'user' },
      ]);
    });
  });

  describe('isUserBlocked', () => {
    test('should return true when user is blocked', async () => {
      const userId = 'user123';
      const userToCheckId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue({ userId, blockedUserId: userToCheckId });

      const result = await privacyService.isUserBlocked(userId, userToCheckId);

      expect(mockPrisma.blockedUser.findUnique).toHaveBeenCalledWith({
        where: {
          userId_blockedUserId: {
            userId,
            blockedUserId: userToCheckId,
          },
        },
      });
      expect(result).toBe(true);
    });

    test('should return false when user is not blocked', async () => {
      const userId = 'user123';
      const userToCheckId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);

      const result = await privacyService.isUserBlocked(userId, userToCheckId);

      expect(result).toBe(false);
    });

    test('should return false on error', async () => {
      const userId = 'user123';
      const userToCheckId = 'user456';
      const error = new Error('Database error');

      mockPrisma.blockedUser.findUnique.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await privacyService.isUserBlocked(userId, userToCheckId);

      expect(consoleSpy).toHaveBeenCalledWith('Error checking user is blocked', error);
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('canViewProfile', () => {
    test('should return true for self request', async () => {
      const userId = 'user123';
      const result = await privacyService.canViewProfile(userId, userId);
      expect(result).toBe(true);
    });

    test('should return false when blocked', async () => {
      const viewerId = 'user123';
      const targetUserId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue({ userId: targetUserId, blockedUserId: viewerId });

      const result = await privacyService.canViewProfile(viewerId, targetUserId);

      expect(result).toBe(false);
    });

    test('should return false when user not found', async () => {
      const viewerId = 'user123';
      const targetUserId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue(null);

      const result = await privacyService.canViewProfile(viewerId, targetUserId);

      expect(result).toBe(false);
    });

    test('should return false for anonymous user', async () => {
      const viewerId = 'user123';
      const targetUserId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue({
        id: targetUserId,
        isAnon: true,
      });

      const result = await privacyService.canViewProfile(viewerId, targetUserId);

      expect(result).toBe(false);
    });

    test('should return true for public profile', async () => {
      const viewerId = 'user123';
      const targetUserId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue({
        id: targetUserId,
        profileVisibility: 'public',
        isAnon: false,
      });

      const result = await privacyService.canViewProfile(viewerId, targetUserId);

      expect(result).toBe(true);
    });

    test('should check friendship for friends_only profile', async () => {
      const viewerId = 'user123';
      const targetUserId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue({
        id: targetUserId,
        profileVisibility: 'friends_only',
        isAnon: false,
      });
      mockPrisma.friend.findFirst.mockResolvedValue({
        user_id: viewerId,
        friend_id: targetUserId,
        status: 'accepted',
      });

      const result = await privacyService.canViewProfile(viewerId, targetUserId);

      expect(result).toBe(true);
    });

    test('should return false for private profile', async () => {
      const viewerId = 'user123';
      const targetUserId = 'user456';

      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);
      mockPrisma.userPrivacySettings.findUnique.mockResolvedValue({
        id: targetUserId,
        profileVisibility: 'private',
        isAnon: false,
      });

      const result = await privacyService.canViewProfile(viewerId, targetUserId);

      expect(result).toBe(false);
    });
  });

  describe('areFriends', () => {
    test('should return true when users are friends', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';

      mockPrisma.friend.findFirst.mockResolvedValue({
        user_id: userId1,
        friend_id: userId2,
        status: 'accepted',
      });

      const result = await privacyService.areFriends(userId1, userId2);

      expect(mockPrisma.friend.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { user_id: userId1, friend_id: userId2, status: 'accepted' },
            { user_id: userId2, friend_id: userId1, status: 'accepted' },
          ],
        },
      });
      expect(result).toBe(true);
    });

    test('should return false when users are not friends', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';

      mockPrisma.friend.findFirst.mockResolvedValue(null);

      const result = await privacyService.areFriends(userId1, userId2);

      expect(result).toBe(false);
    });

    test('should return false on error', async () => {
      const userId1 = 'user123';
      const userId2 = 'user456';
      const error = new Error('Database error');

      mockPrisma.friend.findFirst.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await privacyService.areFriends(userId1, userId2);

      expect(consoleSpy).toHaveBeenCalledWith('Error checking if friends ', error);
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });
  });
}); 