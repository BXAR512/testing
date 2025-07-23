const { PrismaClient } = require("../generated/prisma");
const {
  initializeUserInterests,
  createOrGetCoordinates,
} = require("../utils/rankingUtils");

const prisma = new PrismaClient();

async function main() {
  await prisma.eventHistory.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coordinates.deleteMany();

  const coords1 = await createOrGetCoordinates(40.7128, -74.006);
  const coords2 = await createOrGetCoordinates(40.7589, -73.9851);
  const coords3 = await createOrGetCoordinates(40.72, -74.0);
  const coords4 = await createOrGetCoordinates(40.73, -73.99);
  const coords5 = await createOrGetCoordinates(40.7829, -73.9654);
  const coords6 = await createOrGetCoordinates(40.75, -73.98);
  const coords7 = await createOrGetCoordinates(40.74, -73.97);
  const coords8 = await createOrGetCoordinates(40.76, -73.95);
  const coords9 = await createOrGetCoordinates(40.72, -74.01);
  const coords10 = await createOrGetCoordinates(40.73, -73.968);

  const student1 = await prisma.user.create({
    data: {
      username: "student1",
      role: "student",
      password: "password",
      coordinatesId: coords1.id,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      username: "student2",
      role: "student",
      password: "password",
      coordinatesId: coords2.id,
    },
  });

  const parent1 = await prisma.user.create({
    data: {
      username: "parent1",
      role: "parent",
      password: "password",
      coordinatesId: coords1.id,
    },
  });

  await initializeUserInterests(student1.id);
  await initializeUserInterests(student2.id);

  await prisma.userInterest.updateMany({
    where: { user_id: student1.id },
    data: {
      ranking: 3,
    },
  });

  await prisma.userInterest.update({
    where: {
      user_id_category: {
        user_id: student1.id,
        category: "Music",
      },
    },
    data: { ranking: 5 },
  });
  await prisma.userInterest.update({
    where: {
      user_id_category: {
        user_id: student1.id,
        category: "Food",
      },
    },
    data: { ranking: 4 },
  });
  await prisma.userInterest.update({
    where: {
      user_id_category: {
        user_id: student1.id,
        category: "Tech",
      },
    },
    data: { ranking: 2 },
  });
  await prisma.userInterest.update({
    where: {
      user_id_category: {
        user_id: student2.id,
        category: "Sports/Fitness",
      },
    },
    data: { ranking: 5 },
  });
  await prisma.userInterest.update({
    where: {
      user_id_category: {
        user_id: student2.id,
        category: "Art",
      },
    },
    data: { ranking: 4 },
  });

  const student1Availability = await prisma.availability.createMany({
    data: [
      {
        description: "Morning",
        start_date: new Date("2026-01-20T09:00:00Z"),
        end_date: new Date("2026-01-20T12:00:00Z"),
        user_id: student1.id,
      },
      {
        description: "Afternoon",
        start_date: new Date("2026-01-20T14:00:00Z"),
        end_date: new Date("2026-01-20T16:00:00Z"),
        user_id: student1.id,
      },
      {
        description: "Evening",
        start_date: new Date("2026-01-22T17:00:00Z"),
        end_date: new Date("2026-01-22T20:00:00Z"),
        user_id: student1.id,
      },
    ],
  });

  const student2Availability = await prisma.availability.createMany({
    data: [
      {
        description: "Morning",
        start_date: new Date("2026-01-20T08:00:00Z"),
        end_date: new Date("2026-01-20T11:00:00Z"),
        user_id: student2.id,
      },
      {
        description: "Afternoon",
        start_date: new Date("2026-01-23T15:00:00Z"),
        end_date: new Date("2026-01-23T18:00:00Z"),
        user_id: student2.id,
      },
    ],
  });

  const parent1Availability = await prisma.availability.createMany({
    data: [
      {
        description: "Availabiilty",
        start_date: new Date("2026-01-20T10:00:00Z"),
        end_date: new Date("2026-01-20T16:00:00Z"),
        user_id: parent1.id,
      },
    ],
  });

  const events = await prisma.event.createMany({
    data: [
      {
        title: "Music Concert",
        description: "Live music event",
        category: "Music",
        start_date: new Date("2026-01-20T10:00:00Z"),
        end_date: new Date("2026-01-20T11:30:00Z"),
        location: "Concert Hall",
        coordinatesId: coords3.id,
        capacity: 100,
        num_attending: 50,
      },
      {
        title: "Cooking class",
        description: "Come cook with us",
        category: "Food",
        start_date: new Date("2026-01-20T15:00:00Z"),
        end_date: new Date("2026-01-20T17:00:00Z"),
        location: "Kitchen",
        coordinatesId: coords4.id,
        capacity: 12,
        num_attending: 6,
      },
      {
        title: "Yoga",
        description: "Come decompress",
        category: "Sports/Fitness",
        start_date: new Date("2026-01-20T09:00:00Z"),
        end_date: new Date("2026-01-20T10:00:00Z"),
        location: "Central Park",
        coordinatesId: coords5.id,
        capacity: 25,
        num_attending: 15,
      },
      {
        title: "Art Workshop",
        description: "Come make art",
        category: "Art",
        start_date: new Date("2026-01-22T18:00:00Z"),
        end_date: new Date("2026-01-22T20:00:00Z"),
        location: "Art Studio",
        coordinatesId: coords6.id,
        capacity: 20,
        num_attending: 10,
      },
      {
        title: "Coding bootcamp",
        description: "Come learn to code",
        category: "Tech",
        start_date: new Date("2026-01-23T16:00:00Z"),
        end_date: new Date("2026-01-23T18:30:00Z"),
        location: "Coding lab",
        coordinatesId: coords7.id,
        capacity: 15,
        num_attending: 8,
      },
      {
        title: "Basketball Tournament",
        description: "Come play basketball",
        category: "Sports/Fitness",
        start_date: new Date("2026-01-21T14:00:00Z"),
        end_date: new Date("2026-01-21T17:00:00Z"),
        location: "Gym",
        coordinatesId: coords8.id,
        capacity: 45,
        num_attending: 32,
      },
      {
        title: "Orchestra",
        description: "Come watch the orchestra",
        category: "Music",
        start_date: new Date("2026-01-20T19:00:00Z"),
        end_date: new Date("2026-01-20T21:00:00Z"),
        location: "Concert Hall",
        coordinatesId: coords9.id,
        capacity: 35,
        num_attending: 20,
      },
      {
        title: "Pottery",
        description: "Come make something",
        category: "Art",
        start_date: new Date("2026-01-21T10:00:00Z"),
        end_date: new Date("2026-01-21T12:00:00Z"),
        location: "Studio",
        coordinatesId: coords10.id,
        capacity: 12,
        num_attending: 7,
      },
    ],
  });

  const createdEvents = await prisma.event.findMany();

  const eventHistory = await prisma.eventHistory.createMany({
    data: [
      {
        user_id: student1.id,
        event_id: createdEvents[0].id,
        attended: true,
      },
      {
        user_id: student1.id,
        event_id: createdEvents[6].id,
        attended: true,
      },
      {
        user_id: student1.id,
        event_id: createdEvents[1].id,
        attended: true,
      },
      {
        user_id: student2.id,
        event_id: createdEvents[2].id,
        attended: true,
      },
      {
        user_id: student2.id,
        event_id: createdEvents[5].id,
        attended: true,
      },
      {
        user_id: student2.id,
        event_id: createdEvents[7].id,
        attended: true,
      },
    ],
  });
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
