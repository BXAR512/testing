const CarpoolService = require("../service/carpoolService");
const { PrismaClient } = require("../generated/prisma");
describe("CarpoolService", () => {
  let carpoolService;
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  beforeEach(async () => {
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
          role: "owner",
        },
      });

      const event = await prisma.event.create({
        data: {
          title: "Test Event",
          description: "Test",
          category: "Music",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: creator.id,
          isPublic: false,
        },
      });

      const result = await carpoolService.canViewCarpoolParticipants(
        creator.id,
        event.id
      );
      expect(result).toBe(true);
    });

    test("should allow viewing carpool participants of public events", async () => {
      const creator = await prisma.user.create({
        data: {
          username: "creator",
          password: "password",
          role: "owner",
        },
      });

      const user = await prisma.user.create({
        data: {
          username: "viewer",
          password: "password",
          role: "student",
        },
      });

      const event = await prisma.event.create({
        data: {
          title: "Public Event",
          description: "Public",
          category: "Music",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: creator.id,
          isPublic: true,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });

      const result = await carpoolService.canViewCarpoolParticipants(
        user.id,
        event.id
      );

      expect(result).toBe(true);
    });

    test("should allow attendees to view carpool participants of private events", async () => {
      const creator = await prisma.user.create({
        data: {
          username: "creator",
          password: "password",
          role: "owner",
        },
      });

      const user = await prisma.user.create({
        data: {
          username: "viewer",
          password: "password",
          role: "student",
        },
      });

      const event = await prisma.event.create({
        data: {
          title: "Private Event",
          description: "Private",
          category: "Music",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: creator.id,
          isPublic: false,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });

      const result = await carpoolService.canViewCarpoolParticipants(
        user.id,
        event.id
      );

      expect(result).toBe(true);
    });

    test("should deny viewing carpool participants of private events for non-attendees", async () => {
      const creator = await prisma.user.create({
        data: {
          username: "creator",
          password: "password",
          role: "owner",
        },
      });

      const user = await prisma.user.create({
        data: {
          username: "viewer",
          password: "password",
          role: "student",
        },
      });

      const event = await prisma.event.create({
        data: {
          title: "Private Event",
          description: "Private",
          category: "Music",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: creator.id,
          isPublic: false,
        },
      });

      const result = await carpoolService.canViewCarpoolParticipants(
        user.id,
        event.id
      );

      expect(result).toBe(false);
    });
  });

  describe("getCarpoolParticipants", () => {
    test("should return only non-anonymous users as carpool participants", async () => {
      const organizer = await prisma.user.create({
        data: {
          username: "creator",
          password: "password",
          role: "owner",
        },
      });

      const anonymous = await prisma.user.create({
        data: {
          username: "anon",
          password: "password",
          role: "student",
        },
      });
      const user = await prisma.user.create({
        data: {
          username: "regular",
          password: "password",
          role: "student",
        },
      });

      const publicEvent = await prisma.event.create({
        data: {
          title: "Test Event",
          description: "Test",
          category: "Music",
          start_date: new Date(),
          end_date: new Date(),
          creatorId: organizer.id,
          isPublic: true,
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: anonymous.id,
          isAnon: true,
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: false,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: anonymous.id,
          eventId: publicEvent.id,
        },
      });

      await prisma.eventAttendance.create({
        data: {
          userId: user.id,
          eventId: publicEvent.id,
        },
      });

      const participants = await carpoolService.getCarpoolParticipants(
        publicEvent.id
      );

      expect(participants).toHaveLength(1);
      expect(participants[0].userId).toBe(user.id);
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
      const anon = await prisma.user.create({
        data: {
          username: "anon",
          password: "password",
          role: "student",
        },
      });
      const user = await prisma.user.create({
        data: {
          username: "user",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: anon.id,
          isAnon: true,
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: false,
        },
      });

      const participants = [
        { userId: anon.id, username: "anon" },
        { userId: user.id, username: "user" },
      ];
      const result = await carpoolService.filterCarpoolParticipants(
        viewer.id,
        participants
      );

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(user.id);
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
      const result = await carpoolService.canViewParticipantProfile(
        user.id,
        user.id
      );
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

      const anon = await prisma.user.create({
        data: {
          username: "anon",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: anon.id,
          isAnon: true,
        },
      });

      const result = await carpoolService.canViewParticipantProfile(
        viewer.id,
        anon.id
      );

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

      const user = await prisma.user.create({
        data: {
          username: "regular",
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

      const result = await carpoolService.canViewParticipantProfile(
        viewer.id,
        user.id
      );

      expect(result).toBe(true);
    });
  });

  describe("getCarpoolDisplayName", () => {
    test("should return anonymous username for anonymous user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "anon",
          password: "password",
          role: "student",
        },
      });

      await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
          isAnon: true,
          anonUsername: "turtle",
        },
      });

      const result = await carpoolService.getCarpoolDisplayName(user.id);

      expect(result).toBe("turtle");
    });
    test("should return real username for  user", async () => {
      const user = await prisma.user.create({
        data: {
          username: "real",
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

      expect(result).toBe("real");
    });
  });
});
