let PrismaClient;
try {
  const prismaModule = require("../generated/prisma");
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  // For testing environment, create a mock
  PrismaClient = class MockPrismaClient {
    constructor() {
      this.user = {
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

class ScheduleService {
  constructor() {
    this.prisma = prisma;
  }

  async canViewSchedule(viewerId, targetUserId) {
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
      
      // If user is anonymous, their schedule is not viewable by others
      if (privacySettings.isAnon) {
        return false;
      }
      
      // For non-anonymous users, schedules are viewable by everyone
      return true;
    } catch (error) {
      console.error("Error checking schedule view permission:", error);
      return false;
    }
  }

  async getUserSchedule(userId) {
    try {
      // Get all events the user is attending
      const attendances = await this.prisma.eventAttendance.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              start_date: true,
              end_date: true,
              location: true,
              isPublic: true,
              creatorId: true,
            },
          },
        },
        orderBy: {
          event: {
            start_date: 'asc',
          },
        },
      });

      // Format the schedule data
      return attendances.map(attendance => ({
        id: attendance.id,
        eventId: attendance.event.id,
        eventTitle: attendance.event.title,
        eventDescription: attendance.event.description,
        eventCategory: attendance.event.category,
        startDate: attendance.event.start_date,
        endDate: attendance.event.end_date,
        location: attendance.event.location,
        isPublic: attendance.event.isPublic,
        creatorId: attendance.event.creatorId,
      }));
    } catch (error) {
      console.error("Error getting user schedule:", error);
      return [];
    }
  }

  async filterSchedule(viewerId, schedule) {
    try {
      const filteredSchedule = [];

      for (const event of schedule) {
        // Check if the event is public or if the viewer is the event creator
        const canViewEvent = event.isPublic || viewerId === event.creatorId;
        
        if (canViewEvent) {
          filteredSchedule.push(event);
        }
      }
      return filteredSchedule;
    } catch (error) {
      console.error("Error filtering schedule: ", error);
      return [];
    }
  }

  async getScheduleDisplayName(userId) {
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
      console.error("Error getting schedule display name:", error);
      return "Unknown User";
    }
  }

  async getSchedulePrivacyStatus(userId) {
    try {
      const privacySettings = await this.prisma.userPrivacySettings.findUnique({
        where: { userId },
      });
      
      return {
        isAnonymous: privacySettings ? privacySettings.isAnon : false,
        displayName: await this.getScheduleDisplayName(userId),
      };
    } catch (error) {
      console.error("Error getting schedule privacy status:", error);
      return {
        isAnonymous: false,
        displayName: "Unknown User",
      };
    }
  }

  async getUpcomingEvents(userId, limit = 10) {
    try {
      const now = new Date();
      
      const attendances = await this.prisma.eventAttendance.findMany({
        where: {
          userId,
          event: {
            start_date: {
              gte: now,
            },
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              start_date: true,
              end_date: true,
              location: true,
              isPublic: true,
              creatorId: true,
            },
          },
        },
        orderBy: {
          event: {
            start_date: 'asc',
          },
        },
        take: limit,
      });

      return attendances.map(attendance => ({
        id: attendance.id,
        eventId: attendance.event.id,
        eventTitle: attendance.event.title,
        eventDescription: attendance.event.description,
        eventCategory: attendance.event.category,
        startDate: attendance.event.start_date,
        endDate: attendance.event.end_date,
        location: attendance.event.location,
        isPublic: attendance.event.isPublic,
        creatorId: attendance.event.creatorId,
      }));
    } catch (error) {
      console.error("Error getting upcoming events:", error);
      return [];
    }
  }

  async getPastEvents(userId, limit = 10) {
    try {
      const now = new Date();
      
      const attendances = await this.prisma.eventAttendance.findMany({
        where: {
          userId,
          event: {
            end_date: {
              lt: now,
            },
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              start_date: true,
              end_date: true,
              location: true,
              isPublic: true,
              creatorId: true,
            },
          },
        },
        orderBy: {
          event: {
            start_date: 'desc',
          },
        },
        take: limit,
      });

      return attendances.map(attendance => ({
        id: attendance.id,
        eventId: attendance.event.id,
        eventTitle: attendance.event.title,
        eventDescription: attendance.event.description,
        eventCategory: attendance.event.category,
        startDate: attendance.event.start_date,
        endDate: attendance.event.end_date,
        location: attendance.event.location,
        isPublic: attendance.event.isPublic,
        creatorId: attendance.event.creatorId,
      }));
    } catch (error) {
      console.error("Error getting past events:", error);
      return [];
    }
  }
}

module.exports = ScheduleService; 