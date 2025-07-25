const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const PrivacyService = require("../service/privacyService");

let PrismaClient;
try {
  const prismaModule = require("../generated/prisma");
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  // For testing environment, create a mock
  PrismaClient = class MockPrismaClient {
    constructor() {
      this.userPrivacySettings = {
        findUnique: jest.fn(),
      };
      this.user = {
        findUnique: jest.fn(),
      };
    }
  };
}

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

    // Check if user can view profile using privacy service
    const canView = await privacyService.canViewProfile(request.requesterId, request.targetId);
    
    if (!canView) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Profile is private").setHandler(
          "ViewProfileHandler-Private"
        ),
      };
    }

    // Get user data and filter it based on privacy settings
    const userData = await this.getUserData(request.targetId);
    const filteredData = await privacyService.filterUserData(request.requesterId, userData);

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
    
    // If user is anonymous, return anonymous data
    if (privacySettings && privacySettings.isAnon) {
      return {
        id: user.id,
        username: privacySettings.anonUsername || "Anonymous User",
        role: user.role,
        interest: user.interest,
        isAnon: true,
      };
    }

    return {
      ...user,
      isAnon: false,
    };
  }

  async getPrivacySettings(userId) {
    return await prisma.userPrivacySettings.findUnique({
      where: { userId },
    });
  }
}

module.exports = ViewProfileHandler;
