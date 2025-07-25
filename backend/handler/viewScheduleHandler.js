const ActionHandler = require("./actionHandler");
const PrivacyResponse = require("./privacyResponse");
const ScheduleService = require("../service/scheduleService");

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
      this.event = {
        findMany: jest.fn(),
      };
    }
  };
}

const prisma = new PrismaClient();
const scheduleService = new ScheduleService();

class ViewScheduleHandler extends ActionHandler {
  constructor() {
    super("view_schedule");
  }

  async processUserLevels(request) {
    const targetUserId = request.targetId;
    if (!targetUserId) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Target user ID not provided").setHandler(
          "ViewScheduleHandler-NoTarget"
        ),
      };
    }

    // Check if user can view schedule using schedule service
    const canView = await scheduleService.canViewSchedule(request.requesterId, targetUserId);
    
    if (!canView) {
      return {
        handled: true,
        response: PrivacyResponse.failure("Schedule is private").setHandler(
          "ViewScheduleHandler-Private"
        ),
      };
    }

    // Get user schedule and filter it based on privacy settings
    const schedule = await scheduleService.getUserSchedule(targetUserId);
    const filteredSchedule = await scheduleService.filterSchedule(request.requesterId, schedule);

    // Determine handler type based on access level
    const handlerType = this.determineHandlerType(request.requesterId, targetUserId);

    return {
      handled: true,
      response: PrivacyResponse.success(filteredSchedule).setHandler(handlerType),
    };
  }

  determineHandlerType(requesterId, targetUserId) {
    // Determine access type first
    let accessType;
    
    if (requesterId === targetUserId) {
      accessType = "SELF";
    } else {
      accessType = "OTHER";
    }

    // Use switch statement to determine handler type
    switch (accessType) {
      case "SELF":
        return "ViewScheduleHandler-Self";
      case "OTHER":
        return "ViewScheduleHandler-Other";
      default:
        return "ViewScheduleHandler-Default";
    }
  }
}

module.exports = ViewScheduleHandler; 