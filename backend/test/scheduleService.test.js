const ScheduleService = require("../service/scheduleService");
const { PrismaClient } = require("../generated/prisma");

describe("ScheduleService", () => {
  let scheduleService;
  let prisma;

  beforeAll(async () => {
    // Use a test database URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://username:password@localhost:5432/sera_test_db";
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.userPrivacySettings.deleteMany();
    await prisma.eventAttendance.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    
    scheduleService = new ScheduleService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("canViewSchedule", () => {
    test("should allow self-viewing", async () => {
      const user = await prisma.user.create({
        data: {
          username: "selfuser",
          password: "password",
          role: "student",
        },
      });

      const result = await scheduleService.canViewSchedule(user.id, user.id);

      expect(result).toBe(true);
    });

    test("should deny viewing anonymous user's schedule", async () => {
      const viewer = await prisma.user.create({
        data: {
          username: "viewer",
          password: "password",
          role: "student",
        },
      });

      const anonymousUser = await prisma.user.create({
        data: {
          username: "anonymous",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: anonymousUser.id,
          isAnon: true,
        },
      });

      const result = await scheduleService.canViewSchedule(viewer.id, anonymousUser.id);

      expect(result).toBe(false);
    });

    test("should allow viewing non-anonymous user's schedule", async () => {
      const viewer = await prisma.user.create({
        data: {
          username: "viewer",
          password: "password",
          role: "student",
        },
      });

      const regularUser = await prisma.user.create({
        data: {
          username: "regular",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: regularUser.id,
          isAnon: false,
        },
      });

      const result = await scheduleService.canViewSchedule(viewer.id, regularUser.id);

      expect(result).toBe(true);
    });
  });

  describe("getUserSchedule", () => {
    test("should return user's schedule with events", async () => {
      const user = await prisma.user.create({
        data: {
          username: "testuser",
          password: "password",
          role: "student",
        },
      });

      const event = await prisma.event.create({
        data: {
          title: "Test Event",
          description: "Test Description",
          category: "Test",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: user.id,
          isPublic: true,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });

      const schedule = await scheduleService.getUserSchedule(user.id);

      expect(schedule).toHaveLength(1);
      expect(schedule[0].eventId).toBe(event.id);
      expect(schedule[0].eventTitle).toBe("Test Event");
    });

    test("should return empty array for user with no events", async () => {
      const user = await prisma.user.create({
        data: {
          username: "noeventsuser",
          password: "password",
          role: "student",
        },
      });

      const schedule = await scheduleService.getUserSchedule(user.id);

      expect(schedule).toHaveLength(0);
    });
  });

  describe("filterSchedule", () => {
    test("should filter schedule to show only public events and events created by viewer", async () => {
      const viewer = await prisma.user.create({
        data: {
          username: "viewer",
          password: "password",
          role: "student",
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          username: "other",
          password: "password",
          role: "student",
        },
      });

      const schedule = [
        {
          eventId: 1,
          eventTitle: "Public Event",
          isPublic: true,
          creatorId: otherUser.id,
        },
        {
          eventId: 2,
          eventTitle: "Private Event",
          isPublic: false,
          creatorId: otherUser.id,
        },
        {
          eventId: 3,
          eventTitle: "My Event",
          isPublic: false,
          creatorId: viewer.id,
        },
      ];

      const result = await scheduleService.filterSchedule(viewer.id, schedule);

      expect(result).toHaveLength(2);
      expect(result[0].eventId).toBe(1); // Public event
      expect(result[1].eventId).toBe(3); // Event created by viewer
    });
  });

  describe("getScheduleDisplayName", () => {
    test("should return anonymous username for anonymous user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "secretuser",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: true,
          anonUsername: "Secret User",
        },
      });

      const result = await scheduleService.getScheduleDisplayName(user.id);

      expect(result).toBe("Secret User");
    });

    test("should return real username for non-anonymous user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "realuser",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: false,
        },
      });

      const result = await scheduleService.getScheduleDisplayName(user.id);

      expect(result).toBe("realuser");
    });
  });

  describe("getSchedulePrivacyStatus", () => {
    test("should return privacy status for anonymous user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "secretuser",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: true,
          anonUsername: "Secret User",
        },
      });

      const result = await scheduleService.getSchedulePrivacyStatus(user.id);

      expect(result.isAnonymous).toBe(true);
      expect(result.displayName).toBe("Secret User");
    });

    test("should return privacy status for non-anonymous user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "realuser",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: false,
        },
      });

      const result = await scheduleService.getSchedulePrivacyStatus(user.id);

      expect(result.isAnonymous).toBe(false);
      expect(result.displayName).toBe("realuser");
    });
  });

  describe("getUpcomingEvents", () => {
    test("should return upcoming events for user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "testuser",
          password: "password",
          role: "student",
        },
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const event = await prisma.event.create({
        data: {
          title: "Future Event",
          description: "Future Description",
          category: "Test",
          start_date: futureDate,
          end_date: futureDate,
          creatorId: user.id,
          isPublic: true,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });

      const upcomingEvents = await scheduleService.getUpcomingEvents(user.id);

      expect(upcomingEvents).toHaveLength(1);
      expect(upcomingEvents[0].eventId).toBe(event.id);
      expect(upcomingEvents[0].eventTitle).toBe("Future Event");
    });
  });

  describe("getPastEvents", () => {
    test("should return past events for user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "testuser",
          password: "password",
          role: "student",
        },
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const event = await prisma.event.create({
        data: {
          title: "Past Event",
          description: "Past Description",
          category: "Test",
          start_date: pastDate,
          end_date: pastDate,
          creatorId: user.id,
          isPublic: true,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });

      const pastEvents = await scheduleService.getPastEvents(user.id);

      expect(pastEvents).toHaveLength(1);
      expect(pastEvents[0].eventId).toBe(event.id);
      expect(pastEvents[0].eventTitle).toBe("Past Event");
    });
  });
}); 