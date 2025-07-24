const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

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

    // Event creator can always see attendees
    if (request.requesterId === event.creatorId) {
      const attendees = await this.getAttendees(eventId);
      return {
        handled: true,
        response: PrivacyResponse.success(attendees).setHandler(
          "ViewAttendeesHandler-Owner"
        ),
      };
    }

    // If event is public, anyone can see attendees
    if (event.isPublic) {
      const attendees = await this.getAttendees(eventId);
      return {
        handled: true,
        response: PrivacyResponse.success(attendees).setHandler(
          "ViewAttendeesHandler-Public"
        ),
      };
    }

    // If event is private, only attendees can see other attendees
    const isAttending = await this.checkAttendance(
      request.requesterId,
      eventId
    );
    if (isAttending) {
      const attendees = await this.getAttendees(eventId);
      return {
        handled: true,
        response: PrivacyResponse.success(attendees).setHandler(
          "ViewAttendeesHandler-Attendee"
        ),
      };
    }

    // Default: access denied
    return {
      handled: true,
      response: PrivacyResponse.failure("Access denied").setHandler(
        "ViewAttendeesHandler-Default"
      ),
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

  async checkAttendance(userId, eventId) {
    const attendance = await prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return !!attendance;
  }
}

module.exports = viewAttendeesHandler;
