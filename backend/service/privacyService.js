const { PrismaClient } = require("../generated/prisma");

class PrivacyService {
  constructor() {
    this.prisma = new PrismaClient();
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
      console.error("Error creating settings:", error);
    }
  }

  async getPrivacySettings(userId) {
    try {
      return await this.prisma.userPrivacySettings.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error("Error getting settings", error);
    }
  }

  async updatePrivacySettings(userId, settings) {
    try {
      return await this.prisma.userPrivacySettings.update({
        where: { userId },
        data: settings,
      });
    } catch (error) {
      console.error("Error updating privacy settings ", error);
    }
  }
  async isUserAnonymous(userId) {
    try {
      const settings = await this.getPrivacySettings(userId);
      return settings ? settings.isAnon : false;
    } catch (error) {
      console.error("Error checking if user is anonymous: ", error);
      return false;
    }
  }
  async getAnonymousUsername(userId) {
    try {
      const settings = await this.getPrivacySettings(userId);
      return settings ? settings.anonUsername : null;
    } catch (error) {
      console.error("Error getting anonymous username: ", error);
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
      if (privacySettings.isAnon) {
        return false;
      }
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
      if (viewerId === event.creatorId) {
        return true;
      }
      if (event.isPublic) {
        return true;
      }

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
      console.error("Error checking event atttendees view permission: ", error);
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
        if: userData.id,
        uername: "Private user",
        isPrivate: true,
      };
    }
  }
  async filterAttendeesList(viewerId, attendees) {
    try {
      const filterAttendees = [];

      for (const attendee of attendees) {
        const canViewAttendee = await this.canViewProfile(
          viewerId,
          attendee.user.id
        );
        if (canViewAttendee) {
          const attendeePrivacySettings = await this.getPrivacySettings(
            attendee.user.id
          );

          if (attendeePrivacySettings && attendeePrivacySettings.isAnon) {
            filterAttendees.push({
              id: attendee.user.id,
              username:
                attendeePrivacySettings.anonUsername || "Anonymous User",
              isAnon: true,
              role: attendee.user.role,
            });
          } else {
            filterAttendees.push(attendee);
          }
        }
      }
      return filterAttendees;
    } catch (error) {
      console.error("Error filtering friends lsit: ", error);
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
      console.error("Error getting display name: ", error);
      return "Unknown user";
    }
  }

  async ensurePrivacySettings(userId) {
    try {
      let settings = await this.getPrivacySettings(userId);
      if (!settings) {
        settings = await this.createPrivacySettings(userId);
      }
      return settings;
    } catch {
      console.error("Error ensuring privacy settings: ", error);
      return null;
    }
  }
}

module.exports = PrivacyService;
