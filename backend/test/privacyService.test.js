const PrivacyService = require("../service/privacyService");
const { PrismaClient } = require("../generated/prisma");
describe("PrivacyService", () => {
  let privacyService;
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

    privacyService = new PrivacyService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should return privacy settings for existing user", async () => {
    const user = await prisma.user.create({
      data: {
        username: "testuser",
        password: "password",
        role: "student",
      },
    });

    const settings = await prisma.userPrivacySettings.create({
      data: {
        userId: user.id,
        isAnon: true,
        anonUsername: "AnonymousUser",
      },
    });
    const result = await privacyService.getPrivacySettings(user.id);
    expect(result).toEqual(settings);
  });

  test("should return null for nonexistent user", async () => {
    const result = await privacyService.getPrivacySettings(12);
    expect(result).toBeNull();
  });

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
        username: "anonuser",
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

  test("should deny anon-viewing", async () => {
    const user = await prisma.user.create({
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

    const result = await privacyService.canViewProfile(user.id, anon.id);

    expect(result).toBe(false);
  });

  test("should allow non-anon viewing", async () => {
    const user = await prisma.user.create({
      data: {
        username: "viewer",
        password: "password",
        role: "student",
      },
    });

    const regular = await prisma.user.create({
      data: {
        username: "regular",
        password: "password",
        role: "student",
      },
    });

    await prisma.userPrivacySettings.create({
      data: {
        userId: regular.id,
        isAnon: false,
      },
    });

    const result = await privacyService.canViewProfile(user.id, regular.id);

    expect(result).toBe(true);
  });

  test("should allow event creator to view attendees", async () => {
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

    const result = await privacyService.canViewEventAttendees(
      creator.id,
      event.id
    );

    expect(result).toBe(true);
  });

  test("should allow viewing attendees of public events", async () => {
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

    const result = await privacyService.canViewEventAttendees(
      user.id,
      event.id
    );

    expect(result).toBe(true);
  });

    test("should allow attendees to view attendees of private events", async () => {
    const creator = await prisma.user.create({
      data: {
        username: "creator",
        password: "password",
        role: "owner",
      },
    });

    const user = await prisma.user.create({
      data: {
        username: "attendee",
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

    const result = await privacyService.canViewEventAttendees(
      user.id,
      event.id
    );

    expect(result).toBe(true);
  });

      test("should deny viewing attendes of private events for non-attendees", async () => {
    const creator = await prisma.user.create({
      data: {
        username: "creator",
        password: "password",
        role: "owner",
      },
    });

    const user = await prisma.user.create({
      data: {
        username: "attendee",
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

    const result = await privacyService.canViewEventAttendees(
      user.id,
      event.id
    );

    expect(result).toBe(false);
  });

  test("should return anonymous username for anonymous user", async() => {
    const user = await prisma.user.create({
      data: {
        username: "alex",
        password: "password",
        role: "student",
      },
    });

    await prisma.userPrivacySettings.create({
        data: {
          userId: user.id,
        isAnon: true,
        anonUsername: "SecretUser",  
        },
    });

    const result = await privacyService.getDisplayName(user.id);

    expect(result).toBe("SecretUser");
  });

    test("should return real username for non-anonymous user", async() => {
    const user = await prisma.user.create({
      data: {
        username: "normaluser",
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

    expect(result).toBe("normaluser");
  });
});
