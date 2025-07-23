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
    if (request.requesterId === event.creatorId) {
      const attendees = await this.getAttendees(eventId);
      return {
        handled: true,
        response: PrivacyResponse.success(attendees).setHandler(
          "ViewAttendeesHandler-Owner"
        ),
      };
    }
    const isBlocked = await this.checkBlockedStatus(
      request.requesterId,
      event.creatorId
    );
    if (isBlocked) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Access blocked").setHandler(
          "ViewAttendeesHandler-Blocked"
        ),
      };
    }

    if (event.isPublic) {
      const attendees = await this.getAttendees(eventId);
      return {
        handled: true,
        response: PrivacyResponse.success(attendees).setHandler(
          "ViewAttendeesHandler-Public"
        ),
      };
    }

    const areFriends = await this.checkFriendship(
      request.requesterId,
      event.creatorId
    );
    if (areFriends) {
      const attendees = await this.getAttendees(eventId);
      return {
        handled: true,
        response: PrivacyResponse.success(attendees).setHandler(
          "ViewAttendeesHandler-Friends"
        ),
      };
    }

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
    return {
      handled: true,
      response: PrivacyResponse.success("Access denied").setHandler(
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
            username: attendance.anonUsername || "Annonymous user",
            isAnon: true,
          }
        : attendance.user,
    }));
  }

  async checkBlockedStatus(requesterId, targetId) {
    const blockedByTarget = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedUserId: {
          userId: targetId,
          blockedUserId: requesterId,
        },
      },
    });

    const hasBlockedTarget = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedUserId: {
          userId: requesterId,
          blockedUserId: targetId,
        },
      },
    });

    return !!(blockedByTarget || hasBlockedTarget);
  }

  async checkFriendship(userId1, userId2) {
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          {
            user_id: userId1,
            friend_id: userId2,
            status: "accepted",
          },
          {
            user_id: userId2,
            friend_id: userId1,
            status: "accepted",
          },
        ],
      },
    });

    return !!friendship;
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
