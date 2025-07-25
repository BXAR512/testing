const { PrismaClient } = require("../generated/prisma");

class CarpoolService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async canViewCarpoolParticipants(userId, eventId) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { creatorId: true, isPublic: true },
      });

      if (!event) {
        return false;
      }
      if (userId === event.creatorId) {
        return true;
      }
      if (event.isPublic) {
        return true;
      }

      const attendance = await this.prisma.eventAttendance.findUnique({
        where: {
          userId_eventId: {
            userId: userId,
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

  async getCarpoolParticipants(eventId) {
    try {
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

      const participants = [];

      for (const attendance of attendances) {
        const privacySettings =
          await this.prisma.userPrivacySettings.findUnique({
            where: { userId: attendance.user.id },
          });
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
      console.error("Error getting carpool participants: ", error);
      return [];
    }
  }
  async filterCarpoolParticipants(viewerId, participants) {
    try {
      const filteredParticipants = [];

      for (const participant of participants) {
        const canViewParticipant = await this.canViewParticipantProfile(
          viewerId,
          participant.userId
        );
        if (canViewParticipant) {
          const participantPrivacySettings =
            await this.prisma.userPrivacySettings.findUnique({
              where: { userId: participant.userId },
            });

          if (
            !participantPrivacySettings ||
            !participantPrivacySettings.isAnon
          ) {
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
      if (privacySettings.isAnon) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking participant profile permissions: ", error);
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
      console.error("Error getting carpool display name: ", error);
      return "Unknown User";
    }
  }
}
module.exports = CarpoolService;
