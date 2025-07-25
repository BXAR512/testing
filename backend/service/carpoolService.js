let PrismaClient;
try {
  const prismaModule = require("../generated/prisma");
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  // For testing environment, create a mock
  PrismaClient = class MockPrismaClient {
    constructor() {
      this.event = {
        findUnique: jest.fn(),
      };
      this.eventAttendance = {
        findMany: jest.fn(),
      };
      this.userPrivacySettings = {
        findUnique: jest.fn(),
      };
    }
  };
}

const prisma = new PrismaClient();

class CarpoolService {
  constructor() {
    this.prisma = prisma;
  }

  async canViewCarpoolParticipants(viewerId, eventId) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { creatorId: true, isPublic: true },
      });

      if (!event) {
        return false;
      }

      // Event creator can always see carpool participants
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
      console.error("Error checking carpool view permission:", error);
      return false;
    }
  }

  async getCarpoolParticipants(eventId) {
    try {
      // Get all attendees for the event
      const attendances = await this.prisma.eventAttendance.findMany({
        where: { eventId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              coordinatesId: true,
            },
          },
        },
      });

      // Filter out anonymous users and format the data
      const participants = [];
      
      for (const attendance of attendances) {
        const privacySettings = await this.prisma.userPrivacySettings.findUnique({
          where: { userId: attendance.user.id },
        });
        
        // Only include non-anonymous users in carpooling
        if (!privacySettings || !privacySettings.isAnon) {
          participants.push({
            id: attendance.id,
            userId: attendance.user.id,
            username: attendance.user.username,
            role: attendance.user.role,
            coordinatesId: attendance.user.coordinatesId,
            isAnon: false,
          });
        }
      }

      return participants;
    } catch (error) {
      console.error("Error getting carpool participants:", error);
      return [];
    }
  }

  async filterCarpoolParticipants(viewerId, participants) {
    try {
      const filteredParticipants = [];

      for (const participant of participants) {
        // Check if viewer can see this participant's profile
        const canViewParticipant = await this.canViewParticipantProfile(viewerId, participant.userId);
        if (canViewParticipant) {
          const participantPrivacySettings = await this.prisma.userPrivacySettings.findUnique({
            where: { userId: participant.userId },
          });

          // Only include non-anonymous users in carpooling
          if (!participantPrivacySettings || !participantPrivacySettings.isAnon) {
            filteredParticipants.push(participant);
          }
        }
      }
      return filteredParticipants;
    } catch (error) {
      console.error("Error filtering carpool participants: ", error);
      return [];
    }
  }

  async canViewParticipantProfile(viewerId, targetUserId) {
    try {
      if (viewerId === targetUserId) {
        return true;
      }
      
      const privacySettings = await this.prisma.userPrivacySettings.findUnique({
        where: { userId: targetUserId },
      });
      
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
      console.error("Error checking participant profile view permission:", error);
      return false;
    }
  }

  async getCarpoolDisplayName(userId) {
    try {
      const privacySettings = await this.prisma.userPrivacySettings.findUnique({
        where: { userId },
      });
      
      if (privacySettings && privacySettings.isAnon) {
        return privacySettings.anonUsername || "Anonymous User";
      }
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      
      return user ? user.username : "Unknown User";
    } catch (error) {
      console.error("Error getting carpool display name:", error);
      return "Unknown User";
    }
  }
}

module.exports = CarpoolService; 