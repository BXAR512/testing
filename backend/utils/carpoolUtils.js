const { PrismaClient } = require("../generated/prisma");
const axios = require("axios");
const prisma = new PrismaClient();
const { calculateTotalScore } = require("./carpoolScoring");
const {
  generateCacheKey,
  clearAllCaches,
  cacheRoute,
  getCacheRoute,
  cacheDistance,
  getCacheDistance,
  cacheAttendee,
  getCacheAttendee,
} = require("./cacheUtil");

const EARTH_RADIUS = 6371
const MAX_CAPACITY = 3;
const RADIANS = 180;
const TRIG = 2;
const KMETER_IN_METER = 1000;
const MINS_IN_SECONDS = 60;
const MAPBOX_API_BASE = "https://api.mapbox.com/directions/v5/mapbox/driving";

function calculateDistance(lat1, long1, lat2, long2) {
  const dLat = ((lat2 - lat1) * Math.PI) / RADIANS;
  const dLong = ((long2 - long1) * Math.PI) / RADIANS;
  const a =
    Math.sin(dLat / TRIG) * Math.sin(dLat / TRIG) +
    Math.cos((lat1 * Math.PI) / RADIANS) *
      Math.cos((lat2 * Math.PI) / RADIANS) *
      Math.sin(dLong / TRIG) *
      Math.sin(dLong / TRIG);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

function getDistance(destination, source) {
  if (!destination.coordinates || !source.coordinates) {
    return Infinity;
  }

  const cacheKey = generateCacheKey(
    destination.coordinates.latitude,
    destination.coordinates.longitude,
    source.coordinates.latitude,
    source.coordinates.longitude
  );

  const cached = getCacheDistance(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const distance = calculateDistance(
    destination.coordinates.latitude,
    destination.coordinates.longitude,
    source.coordinates.latitude,
    source.coordinates.longitude
  );

  cacheDistance(cacheKey, distance);
  return distance;
}

async function routeDistance(driver, passengers, event) {
  if (!driver.coordinates || !event.coordinates) {
    return { distance: Infinity, duration: Infinity, route: [] };
  }
  const cacheKey = generateCacheKey(
    driver.coordinates.latitude,
    driver.coordinates.longitude,
    passengers
      .map((p) => `${p.coordinates?.latitude},${p.coordinates?.longitude}`)
      .join("|"),
    event.coordinates.latitude,
    event.coordinates.longitude
  );

  const cached = getCacheRoute(cacheKey);
  if (cached !== null) {
    return cached;
  }
  try {
    const waypoints = [driver.coordinates];

    passengers.forEach((passenger) => {
      if (passenger.coordinates) {
        waypoints.push(passenger.coordinates);
      }
    });

    waypoints.push(event.coordinates);
    const coordinates = waypoints
      .map((wp) => `${wp.longitude}, ${wp.latitude}`)
      .join(";");

    const token = process.env.MAPBOX_ACCESS_TOKEN;
    const url = `${MAPBOX_API_BASE}/${coordinates}`;
    const response = await axios.get(url, {
      params: {
        access_token: token,
        geometries: "geojson",
        overview: "full",
        steps: true,
      },
    });

    const route = response.data.routes[0];
    const result = {
      distance: Math.round(route.distance / KMETER_IN_METER),
      duration: Math.round(route.duration / MINS_IN_SECONDS),
      route: route.legs.map((leg) => ({
        distance: Math.round(leg.distance / KMETER_IN_METER),
        duration: Math.round(leg.duration / MINS_IN_SECONDS),
        steps: leg.steps.map((step) => ({
          instruction: step.maneuver.instruction,
          distance: Math.round(step.distance),
          duration: Math.round(step.duration),
        })),
      })),
    };
    cacheRoute(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error when calculating distance: ", error);
    return { distance: Infinity, duration: Infinity, route: [] };
  }
}

async function generateDriverCombinations(users, maxCapacity) {
  const combinations = [];
  for (let size = 1; size <= Math.min(maxCapacity, users.length); size++) {
    const driverCombos = generateDriverGroups(users, size);
    combinations.push(...driverCombos);
  }
  return combinations;
}

function generateDriverGroups(arr, size) {
  if (size === 1) return arr.map((item) => [item]);

  const combinations = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const head = arr[i];
    const tailCombos = generateDriverGroups(arr.slice(i + 1), size - 1);
    tailCombos.forEach((combo) => {
      combinations.push([head, ...combo]);
    });
  }
  return combinations;
}
async function getEventAttendees(eventId) {
  try {
    const cacheKey = `event_attendees_${eventId}`;
    const cached = getCacheAttendee(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const eventAttendees = await prisma.eventHistory.findMany({
      where: { event_id: eventId, attended: true },
      include: {
        user: {
          include: { coordinates: true },
        },
      },
    });
    const result = eventAttendees ?? [];
    cacheAttendee(cacheKey, result);
    return result;
  } catch (error) {
    console.error("error fetching event attendees for event");
    return [];
  }
}
async function carpoolAssignment(eventId, requestingUserId, maxResults = 10) {
  try {
    clearAllCaches();
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { coordinates: true },
    });
    if (!event) {
      throw new Error("Event not Found!");
    }
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      include: { coordinates: true },
    });

    if (!requestingUser) {
      throw new Error("User not Found!");
    }

    const allUsers = await prisma.user.findMany({
      include: { coordinates: true },
    });

    const eventAttendees = await getEventAttendees(eventId);
    const attendeeIds = eventAttendees.map((attendee) => attendee.user_id);
    const attendingUser = allUsers.filter((user) =>
      attendeeIds.includes(user.id)
    );

    const driverCombinations = await generateDriverCombinations(
      attendingUser,
      MAX_CAPACITY
    );

    const routes = [];
    let processedCombinations = 0;
    const maxCombinations = Math.min(100, driverCombinations.length);

    for (const drivers of driverCombinations) {
      if (processedCombinations >= maxCombinations) {
        break;
      }
      if (routes.length >= maxResults) {
        break;
      }

      const driverIds = drivers.map((driver) => driver.id);
      const allPassengers = eventAttendees
        .map((attendee) => attendee.user)
        .filter((user) => !driverIds.includes(user.id));
      const assignments = assignPassengersToDrivers(drivers, allPassengers);

      for (const assignment of assignments) {
        if (routes.length >= maxResults) {
          break;
        }
        const requestingUserIsPassenger = assignment.passengers.some(
          (p) => p.id === requestingUserId
        );
        const hasSpaceForRequestingUser =
          assignment.passengers.length < MAX_CAPACITY - 1;

        if (
          (requestingUserIsPassenger || hasSpaceForRequestingUser) &&
          assignment.passengers.length > 0
        ) {
          let finalPassengers = [...assignment.passengers];
          if (!requestingUserIsPassenger && hasSpaceForRequestingUser) {
            finalPassengers.push(requestingUser);
          }
          const routeInfo = await routeDistance(
            assignment.driver,
            finalPassengers,
            event
          );
          const routeScore = calculateTotalScore(
            routeInfo.distance,
            routeInfo.duration,
            assignment.passengers.length
          );

          routes.push({
            driver: {
              id: assignment.driver.id,
              username: assignment.driver.username,
              coordinates: assignment.driver.coordinates,
            },
            passengers: finalPassengers.map((p) => ({
              id: p.id,
              username: p.username,
              coordinates: p.coordinates,
            })),
            event: {
              id: event.id,
              title: event.title,
              coordinates: event.coordinates,
            },
            route: routeInfo,
            score: routeScore,
          });
          routes.sort((a, b) => b.score.totalScore - a.score.totalScore);
          if (routes.length > maxResults) {
            routes.splice(maxResults);
          }
        }
      }
      processedCombinations++;
    }

    return routes;
  } catch (error) {
    console.error("Error in carpool assignment", error);
    return [];
  }
}

function assignPassengersToDrivers(drivers, passengers) {
  const assignments = drivers.map((driver) => ({
    driver,
    passengers: [],
  }));

  const passengerAssignments = passengers.map((passenger) => {
    let closestDriver = null;
    let minDistance = Infinity;

    for (const assignment of assignments) {
      const distance = getDistance(passenger, assignment.driver);
      if (distance < minDistance) {
        minDistance = distance;
        closestDriver = assignment;
      }
    }

    return { passenger, closestDriver };
  });

  passengerAssignments.sort((a, b) => {
    if (!a.closestDriver || !b.closestDriver) {
      return 0;
    }
    const distanceA = getDistance(a.passenger, a.closestDriver.driver);
    const distanceB = getDistance(b.passenger, b.closestDriver.driver);
    return distanceA - distanceB;
  });

  for (const { passenger, closestDriver } of passengerAssignments) {
    if (closestDriver && closestDriver.passengers.length < MAX_CAPACITY - 1) {
      closestDriver.passengers.push(passenger);
    }
  }

  return assignments;
}

async function getCarpoolRoutes(eventId, userId) {
  try {
    const eventAttendance = await prisma.eventHistory.findFirst({
      where: {
        event_id: eventId,
        user_id: userId,
        attended: true,
      },
    });
    if (!eventAttendance) {
      return [];
    }

    const routes = await carpoolAssignment(eventId, userId);

    return routes;
  } catch (error) {
    console.error("Error getting carpool routes: ", error);
    return [];
  }
}

async function getOptimalRoute(eventId, userId) {
  try {
    const routes = await getCarpoolRoutes(eventId, userId);
    if (routes.length === 0) {
      return [];
    }
    return routes[0];
  } catch (error) {
    console.error("Error getting route: ", error);
    return [];
  }
}

module.exports = {
  calculateDistance,
  getDistance,
  routeDistance,
  carpoolAssignment,
  getCarpoolRoutes,
  generateDriverCombinations,
  getOptimalRoute,
  assignPassengersToDrivers,
};
