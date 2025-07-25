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
        create: jest.fn(),
        upsert: jest.fn(),
      };
      this.user = {
        findUnique: jest.fn(),
      };
      this.event = {
        findUnique: jest.fn(),
      };
      this.eventAttendance = {
        findUnique: jest.fn(),
      };
    }
  };
}

const prisma = new PrismaClient();

class PrivacyService {
  constructor() {
    this.prisma = prisma;
  }

  async getPrivacySettings(userId) {
    try {
      return await this.prisma.userPrivacySettings.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error("Error getting privacy settings:", error);
      return null;
    }
  }

  async createPrivacySettings(userId) {
    try {
      return await this.prisma.userPrivacySettings.create({
        data: {
          userId,
          isAnon: false,
          anonUsername: null,
        },
      });
    } catch (error) {
      console.error("Error creating privacy settings:", error);
      return null;
    }
  }

  async updatePrivacySettings(userId, settings) {
    try {
      return await this.prisma.userPrivacySettings.upsert({
        where: { userId },
        update: {
          isAnon: settings.isAnon,
          anonUsername: settings.anonUsername,
        },
        create: {
          userId,
          isAnon: settings.isAnon || false,
          anonUsername: settings.anonUsername,
        },
      });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      return null;
    }
  }

  async isUserAnonymous(userId) {
    try {
      const settings = await this.getPrivacySettings(userId);
      return settings ? settings.isAnon : false;
    } catch (error) {
      console.error("Error checking if user is anonymous:", error);
      return false;
    }
  }

  async getAnonymousUsername(userId) {
    try {
      const settings = await this.getPrivacySettings(userId);
      return settings ? settings.anonUsername : null;
    } catch (error) {
      console.error("Error getting anonymous username:", error);
      return null;
    }
  }

  async canViewProfile(viewerId, targetUserId) {
    try {
      if (viewerId === targetUserId) {
        return true;
      }
      
      const privacySettings = await this.getPrivacySettings(targetUserId);
      if (!privacySettings) {
        return false;
      }
      
      // If user is anonymous, their profile is not viewable by others
      if (privacySettings.isAnon) {
        return false;
      }
      
      // For non-anonymous users, profiles are viewable by everyone
      return true;
    } catch (error) {
      console.error("Error checking profile view permission:", error);
      return false;
    }
  }

  async canViewEventAttendees(viewerId, eventId) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { creatorId: true, isPublic: true },
      });

      if (!event) {
        return false;
      }

      // Event creator can always see attendees
      if (viewerId === event.creatorId) {
        return true;
      }

      // Public events can be viewed by anyone
      if (event.isPublic) {
        return true;
      }

      // Private events can only be viewed by attendees
      const attendance = await this.prisma.eventAttendance.findUnique({
        where: {
          userId_eventId: {
            userId: viewerId,
            eventId: eventId,
          },
        },
      });

      return !!attendance;
    } catch (error) {
      console.error("Error checking event attendees view permission:", error);
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

      return {
        ...userData,
        isAnon: false,
      };
    } catch (error) {
      console.error("Error filtering user data: ", error);
      return {
        id: userData.id,
        username: "Private User",
        isPrivate: true,
      };
    }
  }

  async filterAttendeesList(viewerId, attendees) {
    try {
      const filteredAttendees = [];

      for (const attendee of attendees) {
        const canViewAttendee = await this.canViewProfile(viewerId, attendee.user.id);
        if (canViewAttendee) {
          const attendeePrivacySettings = await this.getPrivacySettings(attendee.user.id);

          if (attendeePrivacySettings && attendeePrivacySettings.isAnon) {
            filteredAttendees.push({
              ...attendee,
              user: {
                id: attendee.user.id,
                username: attendeePrivacySettings.anonUsername || "Anonymous User",
                isAnon: true,
                role: attendee.user.role,
              },
            });
          } else {
            filteredAttendees.push(attendee);
          }
        }
      }
      return filteredAttendees;
    } catch (error) {
      console.error("Error filtering attendees list: ", error);
      return [];
    }
  }

  async getDisplayName(userId) {
    try {
      const privacySettings = await this.getPrivacySettings(userId);
      if (privacySettings && privacySettings.isAnon) {
        return privacySettings.anonUsername || "Anonymous User";
      }
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      
      return user ? user.username : "Unknown User";
    } catch (error) {
      console.error("Error getting display name:", error);
      return "Unknown User";
    }
  }

  async ensurePrivacySettings(userId) {
    try {
      let settings = await this.getPrivacySettings(userId);
      if (!settings) {
        settings = await this.createPrivacySettings(userId);
      }
      return settings;
    } catch (error) {
      console.error("Error ensuring privacy settings:", error);
      return null;
    }
  }
}

module.exports = PrivacyService;
