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
      this.event = {
        findUnique: jest.fn(),
      };
      this.eventAttendance = {
        findMany: jest.fn(),
      };
    }
  };
}

const prisma = new PrismaClient();
const privacyService = new PrivacyService();

class viewAttendeesHandler extends ActionHandler {
  constructor() {
    super("view_attendees");
  }

  async processUserLevels(request) {
    const eventId = request.getContext("eventId");
    if (!eventId) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Event ID not provided").setHandler(
          "ViewAttendeesHandler-NoEvent"
        ),
      };
    }
    
    const event = await this.getEvent(eventId);
    if (!event) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Event not found").setHandler(
          "ViewAttendeesHandler-EventNotFound"
        ),
      };
    }

    // Check if user can view attendees using privacy service
    const canView = await privacyService.canViewEventAttendees(request.requesterId, eventId);
    
    if (!canView) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Access denied").setHandler(
          "ViewAttendeesHandler-Denied"
        ),
      };
    }

    // Get attendees and filter them based on privacy settings
    const attendees = await this.getAttendees(eventId);
    const filteredAttendees = await privacyService.filterAttendeesList(request.requesterId, attendees);

    // Determine handler type based on access level
    let handlerType = "ViewAttendeesHandler-Default";
    if (request.requesterId === event.creatorId) {
      handlerType = "ViewAttendeesHandler-Owner";
    } else if (event.isPublic) {
      handlerType = "ViewAttendeesHandler-Public";
    } else {
      handlerType = "ViewAttendeesHandler-Attendee";
    }

    return {
      handled: true,
      response: PrivacyResponse.success(filteredAttendees).setHandler(handlerType),
    };
  }

  async getEvent(eventId) {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: true,
      },
    });
  }

  async getAttendees(eventId) {
    const attendances = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return attendances.map((attendance) => ({
      ...attendance,
      user: attendance.isAnon
        ? {
            id: attendance.user.id,
            username: attendance.anonUsername || "Anonymous User",
            isAnon: true,
          }
        : attendance.user,
    }));
  }
}

module.exports = viewAttendeesHandler;
