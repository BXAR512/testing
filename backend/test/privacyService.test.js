const PrivacyService = require("../service/privacyService");
const { PrismaClient } = require("../generated/prisma");

describe("PrivacyService", () => {
  let privacyService;
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
    
    privacyService = new PrivacyService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getPrivacySettings", () => {
    test("should return privacy settings for existing user", async () => {
      // Create a test user first
      const user = await prisma.user.create({
        data: {
          username: "testuser",
          password: "password",
          role: "student",
        },
      });

      // Create privacy settings
      const settings = await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: true,
          anonUsername: "Anonymous User",
        },
      });

      const result = await privacyService.getPrivacySettings(user.id);

      expect(result).toEqual(settings);
    });

    test("should return null for non-existing user", async () => {
      const result = await privacyService.getPrivacySettings(999);

      expect(result).toBeNull();
    });
  });

  describe("createPrivacySettings", () => {
    test("should create default privacy settings", async () => {
      const user = await prisma.user.create({
        data: {
          username: "newuser",
          password: "password",
          role: "student",
        },
      });

      const result = await privacyService.createPrivacySettings(user.id);

      expect(result.userId).toBe(user.id);
      expect(result.isAnon).toBe(false);
      expect(result.anonUsername).toBeNull();
    });
  });

  describe("isUserAnonymous", () => {
    test("should return true for anonymous user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "anonuser",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: true,
        },
      });

      const result = await privacyService.isUserAnonymous(user.id);

      expect(result).toBe(true);
    });

    test("should return false for non-anonymous user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "regularuser",
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

      const result = await privacyService.isUserAnonymous(user.id);

      expect(result).toBe(false);
    });

    test("should return false for user without privacy settings", async () => {
      const user = await prisma.user.create({
        data: {
          username: "nosettingsuser",
          password: "password",
          role: "student",
        },
      });

      const result = await privacyService.isUserAnonymous(user.id);

      expect(result).toBe(false);
    });
  });

  describe("canViewProfile", () => {
    test("should allow self-viewing", async () => {
      const user = await prisma.user.create({
        data: {
          username: "selfuser",
          password: "password",
          role: "student",
        },
      });

      const result = await privacyService.canViewProfile(user.id, user.id);

      expect(result).toBe(true);
    });

    test("should deny viewing anonymous user", async () => {
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

      const result = await privacyService.canViewProfile(viewer.id, anonymousUser.id);

      expect(result).toBe(false);
    });

    test("should allow viewing non-anonymous user", async () => {
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

      const result = await privacyService.canViewProfile(viewer.id, regularUser.id);

      expect(result).toBe(true);
    });
  });

  describe("canViewEventAttendees", () => {
    test("should allow event creator to view attendees", async () => {
      const creator = await prisma.user.create({
        data: {
          username: "creator",
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
          creatorId: creator.id,
          isPublic: false,
        },
      });

      const result = await privacyService.canViewEventAttendees(creator.id, event.id);

      expect(result).toBe(true);
    });

    test("should allow viewing attendees of public events", async () => {
      const creator = await prisma.user.create({
        data: {
          username: "creator",
          password: "password",
          role: "student",
        },
      });

      const viewer = await prisma.user.create({
        data: {
          username: "viewer",
          password: "password",
          role: "student",
        },
      });

      const event = await prisma.event.create({
        data: {
          title: "Public Event",
          description: "Public Description",
          category: "Test",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: creator.id,
          isPublic: true,
        },
      });

      const result = await privacyService.canViewEventAttendees(viewer.id, event.id);

      expect(result).toBe(true);
    });

    test("should allow attendees to view attendees of private events", async () => {
      const creator = await prisma.user.create({
        data: {
          username: "creator",
          password: "password",
          role: "student",
        },
      });

      const attendee = await prisma.user.create({
        data: {
          username: "attendee",
          password: "password",
          role: "student",
        },
      });

      const event = await prisma.event.create({
        data: {
          title: "Private Event",
          description: "Private Description",
          category: "Test",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: creator.id,
          isPublic: false,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: attendee.id,
          eventId: event.id,
        },
      });

      const result = await privacyService.canViewEventAttendees(attendee.id, event.id);

      expect(result).toBe(true);
    });

    test("should deny viewing attendees of private events for non-attendees", async () => {
      const creator = await prisma.user.create({
        data: {
          username: "creator",
          password: "password",
          role: "student",
        },
      });

      const nonAttendee = await prisma.user.create({
        data: {
          username: "nonattendee",
          password: "password",
          role: "student",
        },
      });

      const event = await prisma.event.create({
        data: {
          title: "Private Event",
          description: "Private Description",
          category: "Test",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: creator.id,
          isPublic: false,
        },
      });

      const result = await privacyService.canViewEventAttendees(nonAttendee.id, event.id);

      expect(result).toBe(false);
    });
  });

  describe("getDisplayName", () => {
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

      const result = await privacyService.getDisplayName(user.id);

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

      const result = await privacyService.getDisplayName(user.id);

      expect(result).toBe("realuser");
    });
  });
}); 