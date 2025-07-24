const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

class PrivacyService {
  async getPrivacySettings(userId) {
    try {
      return await prisma.userPrivacySettings.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error("Error getting privacy settings:", error);
      return null;
    }
  }

  async createPrivacySettings(userId) {
    try {
      return await prisma.userPrivacySettings.create({
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
      return await prisma.userPrivacySettings.upsert({
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
}

module.exports = PrivacyService;
