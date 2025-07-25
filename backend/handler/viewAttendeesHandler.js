const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const { PrismaClient } = require("../generated/prisma");
const PrivacyService = require("../service/privacyService");

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

    const canView = await privacyService.canViewEventAttendees(
      request.requesterId,
      eventId
    );

    if (!canView) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Access Denied").setHandler(
          "ViewAttendeesHandler-Denied"
        ),
      };
    }

    const attendees = await this.getAttendees(eventId);
    const filteredAttendees = await privacyService.filterAttendeesList(
      request.requesterId,
      attendees
    );

    let handlerType = this.determineHandlerType(request.requesterId, event);

    return {
      handled: true,
      response:
        PrivacyResponse.success(filteredAttendees).setHandler(handlerType),
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
        return "ViewAttendeesHandler-Owner";
      case "PUBLIC":
        return "ViewAttendeesHandler-Public";
      case "ATTENDEE":
        return "ViewAttendeesHandler-Attendee";
      default:
        return "ViewAttendeesHandler-Default";
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
            username: attendance.anonUsername || "Annonymous user",
            isAnon: true,
          }
        : attendance.user,
    }));
  }
}

module.exports = viewAttendeesHandler;
