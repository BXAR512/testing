const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const CarpoolService = require("../service/carpoolService");

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
      this.user = {
        findMany: jest.fn(),
      };
    }
  };
}

const prisma = new PrismaClient();
const carpoolService = new CarpoolService();

class ViewCarpoolHandler extends ActionHandler {
  constructor() {
    super("view_carpool");
  }

  async processUserLevels(request) {
    const eventId = request.getContext("eventId");
    if (!eventId) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Event ID not provided").setHandler(
          "ViewCarpoolHandler-NoEvent"
        ),
      };
    }
    
    const event = await this.getEvent(eventId);
    if (!event) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Event not found").setHandler(
          "ViewCarpoolHandler-EventNotFound"
        ),
      };
    }

    // Check if user can view carpool options using carpool service
    const canView = await carpoolService.canViewCarpoolParticipants(request.requesterId, eventId);
    
    if (!canView) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Access denied").setHandler(
          "ViewCarpoolHandler-Denied"
        ),
      };
    }

    // Get carpool participants and filter them based on privacy settings
    const carpoolParticipants = await carpoolService.getCarpoolParticipants(eventId);
    const filteredParticipants = await carpoolService.filterCarpoolParticipants(request.requesterId, carpoolParticipants);

    // Determine handler type based on access level
    const handlerType = this.determineHandlerType(request.requesterId, event);

    return {
      handled: true,
      response: PrivacyResponse.success(filteredParticipants).setHandler(handlerType),
    };
  }

  determineHandlerType(requesterId, event) {
    // Determine access type first
    let accessType;
    
    if (requesterId === event.creatorId) {
      accessType = "OWNER";
    } else if (event.isPublic) {
      accessType = "PUBLIC";
    } else {
      accessType = "ATTENDEE";
    }

    // Use switch statement to determine handler type
    switch (accessType) {
      case "OWNER":
        return "ViewCarpoolHandler-Owner";
      case "PUBLIC":
        return "ViewCarpoolHandler-Public";
      case "ATTENDEE":
        return "ViewCarpoolHandler-Attendee";
      default:
        return "ViewCarpoolHandler-Default";
    }
  }

  async getEvent(eventId) {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: true,
      },
    });
  }
}

module.exports = ViewCarpoolHandler; 