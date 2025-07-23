const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

class ViewProfileHandler extends ActionHandler {
  constructor() {
    super("view_profile");
  }

  async processUserLevels(request) {
    if (request.isSelfRequest()) {
      const userData = await this.getUserData(request.targetId);
      return {
        handled: true,
        response: PrivacyResponse.success(userData).setHandler(
          "ViewProfileHandler-Self"
        ),
      };
    }

    const isBlocked = await this.checkBlockedStatus(request);
    if (isBlocked) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Access blocked").setHandler(
          "ViewProfileHandler-Blocked"
        ),
      };
    }

    const privacySettings = await this.getPrivacySettings(request.targetId);
    if (!privacySettings) {
      return {
        handled: true,
        response: PrivacyResponse.failure("User not found").setHandler(
          "ViewProfileHandler-NotFound"
        ),
      };
    }

    if (privacySettings.isAnon) {
      const anonData = {
        id: request.targetId,
        usernam: privacySettings.anonUsername || "Anonymous User",
        isAnone: true,
      };
      return {
        handled: true,
        response: PrivacyResponse.anonymous(
          anonData,
          privacySettings.anonUsername
        ).setHandler("ViewProfileHandler-Anonymous"),
      };
    }
    switch (privacySettings.profileVisibility) {
      case "public":
        const publicData = await this.getUserData(request.targetId);
        return {
          handled: true,
          response: PrivacyResponse.success(publicData).setHandler(
            "ViewProfileHandler-Public"
          ),
        };
      case "friend_only":
        const areFriends = await this.checkFriendship(request);
        if (areFriends) {
          const friendData = await this.getUserData(request.targetId);
          return {
            handled: true,
            response: PrivacyResponse.success(friendData).setHandler(
              "ViewProfileHandler-Friends"
            ),
          };
        }
        break;

      case "private":
        return {
          handled: true,
          response: PrivacyResponse.success("Profile is private").setHandler(
            "ViewProfileHandler-Private"
          ),
        };
    }

    return {
      handled: true,
      response: PrivacyResponse.success("Access denied").setHandler(
        "ViewProfileHandler-Default"
      ),
    };
  }
  async getUserData(userId) {
    return await prisma.userPrivacySettings.findUnique({
      where: { userId },
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

module.exports = ViewProfileHandler;
