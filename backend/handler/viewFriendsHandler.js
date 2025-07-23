const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

class ViewFriendsHandler extends ActionHandler {
  constructor() {
    super("view_friends");
  }

  async processUserLevels(request) {
    if (request.isSelfRequest()) {
      const friendData = await this.getUserData(request.targetId);
      return {
        handled: true,
        response: PrivacyResponse.success(friendData).setHandler(
          "ViewFriendsHandler-Self"
        ),
      };
    }

    const isBlocked = await this.checkBlockedStatus(request);
    if (isBlocked) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Access blocked").setHandler(
          "ViewFriendsHandler-Blocked"
        ),
      };
    }

    const privacySettings = await this.getPrivacySettings(request.targetId);
    if (!privacySettings) {
      return {
        handled: true,
        response: PrivacyResponse.failure("User not found").setHandler(
          "ViewFriendsHandler-NotFound"
        ),
      };
    }

    switch (privacySettings.friendVisibility) {
      case "public":
        const publicFriends = await this.getFriendsData(request.targetId);
        return {
          handled: true,
          response: PrivacyResponse.success(publicFriends).setHandler(
            "ViewFriendsHandler-Public"
          ),
        };
      case "friend_only":
        const areFriends = await this.checkFriendship(request);
        if (areFriends) {
          const friendData = await this.getUserData(request.targetId);
          return {
            handled: true,
            response: PrivacyResponse.success(friendData).setHandler(
              "ViewFriendsHandler-Friends"
            ),
          };
        }
        break;

      case "private":
        return {
          handled: true,
          response: PrivacyResponse.success(
            "Friendslist is private"
          ).setHandler("ViewFriendsHandler-Private"),
        };
    }

    return {
      handled: true,
      response: PrivacyResponse.success("Access denied").setHandler(
        "ViewFriendsHandler-Default"
      ),
    };
  }

  async getFriendsData(userId) {
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { user_id: userId, status: "accepted " },
          { friend_id: userId, status: "accepted " },
        ],
      },
      include: {
        user: {
          select: { id: true, username: true, role: true },
        },
        friend: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    return friendships.map((friendship) => {
      if (friendship.user_id === userId) {
        return friendship.friend;
      } else {
        return friendship.user;
      }
    });
  }

  async getPrivacySettings(userId) {
    return await prisma.userPrivacySettings.findUnique({
      where: { userId },
    });
  }
  async checkBlockedStatus(request) {
    const blockedByTarget = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedUserId: {
          userId: request.targetId,
          blockedUserId: request.requesterId,
        },
      },
    });

    const hasBlockedTarget = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedUserId: {
          userId: request.requesterId,
          blockedUserId: request.targetId,
        },
      },
    });

    return !!(blockedByTarget || hasBlockedTarget);
  }

  async checkFriendship(request) {
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          {
            user_id: request.requesterId,
            friend_id: request.targetId,
            status: "accepted",
          },
          {
            user_id: request.targetId,
            friend_id: request.requesterId,
            status: "accepted",
          },
        ],
      },
    });

    return !!friendship;
  }
}

module.exports = ViewFriendsHandler;
