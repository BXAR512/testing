const CarpoolService = require("../service/carpoolService");
const { PrismaClient } = require("../generated/prisma");

describe("CarpoolService", () => {
  let carpoolService;
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
    
    carpoolService = new CarpoolService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("canViewCarpoolParticipants", () => {
    test("should allow event creator to view carpool participants", async () => {
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

      const result = await carpoolService.canViewCarpoolParticipants(creator.id, event.id);

      expect(result).toBe(true);
    });

    test("should allow viewing carpool participants of public events", async () => {
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

      const result = await carpoolService.canViewCarpoolParticipants(viewer.id, event.id);

      expect(result).toBe(true);
    });

    test("should allow attendees to view carpool participants of private events", async () => {
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

      const result = await carpoolService.canViewCarpoolParticipants(attendee.id, event.id);

      expect(result).toBe(true);
    });

    test("should deny viewing carpool participants of private events for non-attendees", async () => {
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

      const result = await carpoolService.canViewCarpoolParticipants(nonAttendee.id, event.id);

      expect(result).toBe(false);
    });
  });

  describe("getCarpoolParticipants", () => {
    test("should return only non-anonymous users as carpool participants", async () => {
      const creator = await prisma.user.create({
        data: {
          username: "creator",
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

      const regularUser = await prisma.user.create({
        data: {
          username: "regular",
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
          isPublic: true,
        },
      });

      // Set up privacy settings
      await prisma.userPrivacySettings.create({
        data: {
          userId: anonymousUser.id,
          isAnon: true,
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: regularUser.id,
          isAnon: false,
        },
      });

      // Create attendances
      await prisma.eventAttendance.create({
        data: {
          userId: anonymousUser.id,
          eventId: event.id,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: regularUser.id,
          eventId: event.id,
        },
      });

      const participants = await carpoolService.getCarpoolParticipants(event.id);

      expect(participants).toHaveLength(1);
      expect(participants[0].userId).toBe(regularUser.id);
      expect(participants[0].username).toBe("regular");
    });
  });

  describe("filterCarpoolParticipants", () => {
    test("should filter out anonymous users from carpool participants", async () => {
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

      const regularUser = await prisma.user.create({
        data: {
          username: "regular",
          password: "password",
          role: "student",
        },
      });

      // Set up privacy settings
      await prisma.userPrivacySettings.create({
        data: {
          userId: anonymousUser.id,
          isAnon: true,
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: regularUser.id,
          isAnon: false,
        },
      });

      const participants = [
        { userId: anonymousUser.id, username: "anonymous" },
        { userId: regularUser.id, username: "regular" },
      ];

      const result = await carpoolService.filterCarpoolParticipants(viewer.id, participants);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(regularUser.id);
    });
  });

  describe("canViewParticipantProfile", () => {
    test("should allow self-viewing", async () => {
      const user = await prisma.user.create({
        data: {
          username: "selfuser",
          password: "password",
          role: "student",
        },
      });

      const result = await carpoolService.canViewParticipantProfile(user.id, user.id);

      expect(result).toBe(true);
    });

    test("should deny viewing anonymous user profile", async () => {
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

      const result = await carpoolService.canViewParticipantProfile(viewer.id, anonymousUser.id);

      expect(result).toBe(false);
    });

    test("should allow viewing non-anonymous user profile", async () => {
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

      const result = await carpoolService.canViewParticipantProfile(viewer.id, regularUser.id);

      expect(result).toBe(true);
    });
  });

  describe("getCarpoolDisplayName", () => {
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

      const result = await carpoolService.getCarpoolDisplayName(user.id);

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

      const result = await carpoolService.getCarpoolDisplayName(user.id);

      expect(result).toBe("realuser");
    });
  });
}); 