const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const { PrismaClient } = require("../generated/prisma");
const CarpoolService = require("../service/carpoolService");

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

    const canView = await carpoolService.canViewCarpoolParticipants(
      request.requesterId,
      eventId
    );

    if (!canView) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Access Denied").setHandler(
          "ViewCarpoolHandler-Denied"
        ),
      };
    }

    const carpoolParticipants = await carpoolService.getCarpoolParticipants(eventId);
    const filteredParticipants = await carpoolService.filterCarpoolParticipants(
      request.requesterId,
      carpoolParticipants
    );

    const handlerType = this.determineHandlerType(request.requesterId, event);

    return {
      handled: true,
      response:
        PrivacyResponse.success(filteredParticipants).setHandler(handlerType),
    };
  }
  determineHandlerType(requesterId, event) {
    let accessType;

    if (requesterId === event.creatorId) {
      accessType = "OWNER";
    } else if (event.isPublic) {
      accessType = "PUBLIC";
    } else {
      accessType = "ATTENDEE";
    }

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
