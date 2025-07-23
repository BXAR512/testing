const { PrismaClient } = require("../generated/prisma");

class PrivacyService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async createPrivacySettings(userId, settings = {}) {
    try {
      const defaultSettings = {
        profileVisibility: "friends_only",
        friendVisibility: "friend_only",
        eventVisibility: "friend_only",
        isAnon: false,
        anonUsername: null,
        ...settings,
      };

      const privacySettings = await this.prisma.userPrivacySettings.create({
        data: {
          userId,
          ...defaultSettings,
        },
      });

      return privacySettings;
    } catch (error) {
      console.error("Error creating settings:", error);
    }
  }

  async getPrivacySettings(userId) {
    try {
      const settings = await this.prisma.userPrivacySettings.findUnique({
        where: { userId },
      });

      return settings;
    } catch (error) {
      console.error("Error getting settings", error);
    }
  }

  async updatePrivacySettings(userId, settings) {
    try {
      const updatedSettings = await this.prisma.userPrivacySettings.update({
        where: { userId },
        data: settings,
      });
      return updatedSettings;
    } catch (error) {
      console.error("Error updating privacy settings ", error);
    }
  }
  async blockUser(userId, userToBlockId) {
    try {
      const isBlocked = await this.isUserBlocked(userId, userToBlockId);

      if (isBlocked) {
        throw new Error("User already blocked");
      }

      const blockedUser = await this.prisma.blockedUser.create({
        data: {
          userId,
          blockedUserId: userToBlockId,
        },
      });

      await this.prisma.friend.deleteMany({
        where: {
          OR: [
            {
              user_id: userId,
              friend_id: userToBlockId,
            },
            {
              user_id: userToBlockId,
              friend_id: userId,
            },
          ],
        },
      });

      return {
        message: "User Blocked successfully",
        blockedUser,
      };
    } catch (error) {
      console.error("Error blocking user: ", error);
    }
  }

  async unblockUser(userId, userToUnblockId) {
    try {
      const isBlocked = await this.isUserBlocked(userId, userToUnblockId);

      if (!isBlocked) {
        throw new Error("User is not blocked");
      }

      await this.prisma.blockedUser.delete({
        where: {
          userId_blockedUserId: {
            userId,
            blockedUserId: userToUnblockId,
          },
        },
      });

      return {
        message: "User unblocked successfully",
      };
    } catch (error) {
      console.log("Error when trying to unblock user ", error);
    }
  }
  async getBlockedUsers(userId) {
    try {
      const blockedUsers = await this.prisma.blockedUser.findMany({
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
      return blockedUsers.map((block) => block.blockedUser);
    } catch (error) {
      console.error("Error getting blocked users:", error);
    }
  }
  async isUserBlocked(userId, userToCheckId) {
    try {
      const blockedUser = await this.prisma.blockedUser.findUnique({
        where: {
          userId_blockedUserId: {
            userId,
            blockedUserId: userToCheckId,
          },
        },
      });
      return !!blockedUser;
    } catch (error) {
      console.error("Error checking user is blocked", error);
      return false;
    }
  }
  async canViewProfile(viewerId, targetUserId) {
    try {
      if (viewerId === targetUserId) {
        return true;
      }
      const isBlocked = await this.isUserBlocked(targetUserId, viewerId);
      if (isBlocked) {
        return false;
      }
      const privacySettings = await this.getPrivacySettings(targetUserId);
      if (!privacySettings) {
        return false;
      }
      if (privacySettings.isAnon) {
        return false;
      }
      switch (privacySettings.profileVisibility) {
        case "public":
          return true;
        case "friends_only":
          return await this.areFriends(viewerId, targetUserId);
        case "private":
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking profile view permission:", error);
      return false;
    }
  }
  async canViewFriends(viewerId, targetUserId) {
    try {
      if (viewerId === targetUserId) {
        return true;
      }
      const isBlocked = await this.isUserBlocked(targetUserId, viewerId);
      if (isBlocked) {
        return false;
      }
      const privacySettings = await this.getPrivacySettings(targetUserId);
      if (!privacySettings) {
        return false;
      }
      if (privacySettings.isAnon) {
        return false;
      }
      switch (privacySettings.profileVisibility) {
        case "public":
          return true;
        case "friends_only":
          return await this.areFriends(viewerId, targetUserId);
        case "private":
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking friends view permission:", error);
      return false;
    }
  }
  async areFriends(userId1, userId2) {
    try {
      const friendship = await this.prisma.friend.findFirst({
        where: {
          OR: [
            {
              user_id: userId1,
              friend_id: userId2,
              status: "accepted",
            },
            {
              user_id: userId2,
              friend_id: userId1,
              status: "accepted",
            },
          ],
        },
      });

      return !!friendship;
    } catch (error) {
      console.error("Error checking if friends ", error);
      return false;
    }
  }
  async filterUserData(viewerId, userData) {
    try {
      const targetUserId = userData.id;
      const canView = await this.canViewProfile(viewerId, targetUserId);

      if (!canView) {
        return {
          id: targetUserId,
          username: "Private User",
          isPrivate: true,
        };
      }

      const privacySettings = await this.getPrivacySettings(targetUserId);

      if (privacySettings && privacySettings.isAnon) {
        return {
          id: targetUserId,
          username: privacySettings.anonUsername || "Anonymous User",
          isAnon: true,
          role: userData.role,
          interest: userData.interest,
        };
      }
      const canViewFriends = await this.canViewFriends(viewerId, targetUserId);
      let filteredFriends = [];
      if (canView && userData.friends) {
        filteredFriends = await this.filterFriendsList(
          viewerId,
          userData.friends
        );
      }
      return {
        ...userData,
        friends: filteredFriends,
        friendsVisible: canViewFriends,
      };
    } catch (error) {
      console.error("Error filtering user data: ", error);
      return {
        if: userData.id,
        uername: "Private user",
        isPrivate: true,
      };
    }
  }
  async filterFriendsList(viewerId, friends) {
    try {
      const filteredFriends = [];

      for (const friend of friends) {
        const canViewFriend = await this.canViewProfile(viewerId, friend.id);
        if (canViewFriend) {
          const friendPrivacySettings = await this.getPrivacySettings(
            friend.id
          );

          if (friendPrivacySettings && friendPrivacySettings.isAnon) {
            filteredFriends.push({
              id: friend.id,
              username: privacySettings.anonUsername || "Anonymous User",
              isAnon: true,
              role: userData.role,
            });
          } else {
            this.filterFriendsList.push(friend);
          }
        }
      }
      return filteredFriends;
    } catch (error) {
      console.error("Error filtering friends lsit: ", error);
      return [];
    }
  }

  async getFriendPrivacySettings(userId, friendId) {
    try {
      const areFriends = await this.areFriends(userId, friendId);

      if (!areFriends) {
        return null;
      }

      const isBlocked = await this.isUserBlocked(friendId, userId);
      if (isBlocked) {
        return null;
      }

      const privacySettings = await this.getFriendPrivacySettings(friendId);
      if (!privacySettings) {
        return null;
      }
      return {
        profileVisibility: privacySettings.profileVisibility,
        friendVisibility: privacySettings.friendVisibility,
        eventVisibility: privacySettings.eventVisibility,
        isAnon: privacySettings.isAnon,
        anonUsername: privacySettings.isAnon
          ? privacySettings.anonUsername
          : null,
      };
    } catch (error) {
      console.error("Error getting friend privacy settings: ", error);
      return null;
    }
  }
}

module.exports = PrivacyService;
