const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const { PrismaClient } = require("../generated/prisma");
const PrivacyService = require("../service/privacyService");

const prisma = new PrismaClient();
const privacyService = new PrivacyService();

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

    const canView = await privacyService.canViewProfile(
      request.requesterId,
      request.targetId
    );

    if (!canView) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Profile is private").setHandler(
          "ViewProfileHandler-Private"
        ),
      };
    }

    const userData = await this.getUserData(request.targetId);
    const filteredData = await privacyService.filterUserData(
      request.requesterId,
      userData
    );

    return {
      handled: true,
      response: PrivacyResponse.success(filteredData).setHandler(
        "ViewProfileHandler-Public"
      ),
    };
  }

  async getUserData(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        interest: true,
      },
    });

    if (!user) {
      return null;
    }

    const privacySettings = await this.getPrivacySettings(userId);
    if (privacySettings && privacySettings.isAnon) {
      return {
        id: user.id,
        username: privacySettings.anonUsername || "Annonymous User",
        role: user.role,
        interest: user.interest,
        isAnon: true,
      };
    }
    return await prisma.userPrivacySettings.findUnique({
      where: { userId },
    });
  }
  async getPrivacySettings(userId) {
    return await prisma.userPrivacySettings.findUnique({
      where: { userId },
    });
  }
}

module.exports = ViewProfileHandler;
