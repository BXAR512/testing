const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const SCORES = {
  AVAILABILITY_PERFECT: 50,
  AVAILABILITY_PARTIAL: 25,
  AVAILABILITY_MINIMUM: 10,

  DISTANCE_CLOSE: 30,
  DISTANCE_MEDIUM: 20,
  DISTANCE_FAR: 10,
  DISTANCE_VERY_FAR: 5,

  PAST_ATTENDANCE_SIMILAR: 40,
  PAST_ATTENDANCE_CATEGORY_MATCH: 20,
  PAST_ATTENDANCE_ATTENDED: 10,
};

const DEFAULT_WEIGHTS = {
  availability: 0.35,
  distance: 0.25,
  interest: 0.25,
  pastAttendance: 0.15,
};

const TIME_DECAY_FACTOR = 0.5;
const TIME_DECAY_MONTHS = 3;
const SCORE_MULTIPLIER = 20;
const EARTH_RADIUS = 6371
const RADIANS = 180;
const TRIG = 2;

const PARTIAL_MULTIPLIER = 0.8
const MS_IN_30_DAYS = 1000 * 60 * 60 * 24 * 30;

const NORMALIZE_OUT_OF = 100;
const INTEREST_CATEGORIES = ["Music", "Art", "Food", "Tech", "Sports/Fitness"];

function isAvailableForEvent(event, availabilityBlock) {
  if (!availabilityBlock || availabilityBlock.length === 0) {
    return 0;
  }

  const eventStart = new Date(event.start_date);
  const eventEnd = new Date(event.end_date);
  let maxScore = 0;

  for (const block of availabilityBlock) {
    const blockStart = new Date(block.start_date);
    const blockEnd = new Date(block.end_date);

    if (eventStart >= blockStart && eventEnd <= blockEnd) {
      return SCORES.AVAILABILITY_PERFECT;
    }
    if (eventStart < blockEnd && eventEnd > blockStart) {
      const overlapStart = new Date(
        Math.max(eventStart.getTime(), blockStart.getTime())
      );
      const overlapEnd = new Date(
        Math.min(eventEnd.getTime(), blockEnd.getTime())
      );
      const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
      const eventDuration = eventEnd.getTime() - eventStart.getTime();

      const overlapPercentage = overlapDuration / eventDuration;

      if (overlapPercentage >= 0.75) {
        maxScore = Math.max(maxScore, SCORES.AVAILABILITY_PARTIAL);
      } else if (overlapPercentage >= 0.5) {
        maxScore = Math.max(
          maxScore,
          Math.floor(SCORES.AVAILABILITY_PARTIAL * PARTIAL_MULTIPLIER)
        );
      } else if (overlapPercentage >= 0.25) {
        maxScore = Math.max(maxScore, SCORES.AVAILABILITY_MINIMUM);
      }
    }
  }
  return maxScore;
}

function isDistant(userCoordinates, eventCoordinates) {
  if (!userCoordinates || !eventCoordinates) {
    return 0;
  }

  const distance = calculateDistance(
    userCoordinates.latitude,
    userCoordinates.longitude,
    eventCoordinates.latitude,
    eventCoordinates.longitude
  );

  if (distance <= 5) {
    return SCORES.DISTANCE_CLOSE;
  } else if (distance <= 15) {
    return SCORES.DISTANCE_MEDIUM;
  } else if (distance <= 30) {
    return SCORES.DISTANCE_FAR;
  } else {
    return SCORES.DISTANCE_VERY_FAR;
  }
}

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

function isInterested(event, studentInterest) {
  if (!event.category || !studentInterest || studentInterest.length === 0) {
    return 0;
  }

  const eventCategory = event.category.toLowerCase();

  const matchingInterest = studentInterest.find(
    (interest) => interest.category.toLowerCase() === eventCategory
  );

  if (!matchingInterest) {
    return 0;
  }
  return matchingInterest.ranking * SCORE_MULTIPLIER;
}

function calculateTimeDecayFactor(eventData) {
  const now = new Date();
  const eventTime = new Date(eventData);
  const monthsDiff =
    (now.getTime() - eventTime.getTime()) / (MS_IN_30_DAYS);

  if (monthsDiff > TIME_DECAY_MONTHS) {
    return TIME_DECAY_FACTOR;
  }
  return 1.0;
}

function normalizeScore(score, maxScore) {
    return Math.min(score/maxScore, 1);
}

function calculateWeightedScore(
  availabilityScore,
  distanceScore,
  interestScore,
  pastAttendanceScore,
  weights = DEFAULT_WEIGHTS
) {
  const normalizedAvailability = normalizeScore(
    availabilityScore,
    SCORES.AVAILABILITY_PERFECT
  );
  const normalizedDistance = normalizeScore(
    distanceScore,
    SCORES.DISTANCE_CLOSE
  );
  const normalizedInterest = normalizeScore(interestScore, NORMALIZE_OUT_OF);
  const normalizedPastAttendance = normalizeScore(pastAttendanceScore, NORMALIZE_OUT_OF);

  const weightedSum =
    normalizedAvailability * weights.availability +
    normalizedDistance * weights.distance +
    normalizedInterest * weights.interest +
    normalizedPastAttendance * weights.pastAttendance;
  return weightedSum;
}

function calculatePastAttendanceScore(event, pastEvents) {
  if (!pastEvents || pastEvents.length === 0) {
    return 0;
  }

  let score = 0;
  const eventCategory = event.category.toLowerCase();
  const eventTitle = event.title.toLowerCase();
  const eventDescription = (event.description ?? "").toLowerCase();

  for (const pastEvent of pastEvents) {
    const pastCategory = pastEvent.category.toLowerCase();
    const pastDescription = (pastEvent.description ?? "").toLowerCase();

    const timeDecay = calculateTimeDecayFactor(pastEvent.start_date);

    if (eventCategory === pastCategory) {
      score += SCORES.PAST_ATTENDANCE_CATEGORY_MATCH * timeDecay;
    }

    const eventKeywords = eventDescription.split(" ");
    const pastKeywords = pastDescription.split(" ");
    const commonKeywords = eventKeywords.filter(
      (keyword) => pastKeywords.includes(keyword) && keyword.length > 3
    );

    if (commonKeywords.length >= 2) {
      score += SCORES.PAST_ATTENDANCE_SIMILAR * timeDecay;
    }

    score += SCORES.PAST_ATTENDANCE_ATTENDED * timeDecay;
  }
  return Math.min(score, NORMALIZE_OUT_OF);
}
function calculateTotalScore(
  availabilityScore,
  distanceScore,
  interestScore,
  pastAttendanceScore,
  weights = DEFAULT_WEIGHTS
) {
  return calculateWeightedScore(
    availabilityScore,
    distanceScore,
    interestScore,
    pastAttendanceScore,
    weights
  );
}

async function getRecommendedEvents(studentId, parentId = null) {
  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        coordinates: true,
        Availablility: true,
        UserInterests: true,
        EventHistory: {
          include: {
            event: {
              include: {
                coordinates: true,
              },
            },
          },
        },
      },
    });

    let parentAvailability = [];
    if (parentId) {
      parentAvailability = await prisma.availability.findMany({
        where: { user_id: parentId },
      });
    }

    const allEvents = await prisma.event.findMany({
      where: {
        start_date: {
          gte: new Date(),
        },
      },
      include: {
        coordinates: true,
      },
    });

    const pastAttendedEvents = student.EventHistory.filter(
      (history) => history.attended
    ).map((history) => history.event);

    const scoredEvents = [];

    for (const event of allEvents) {
      let parentConflict = false;
      if (parentId && parentAvailability.length > 0) {
        parentConflict = !isParentAvailable(event, parentAvailability);
      }

      if (parentConflict) {
        continue;
      }

      const availabilityScore = isAvailableForEvent(
        event,
        student.Availablility
      );
      if (availabilityScore === 0) {
        continue;
      }
      const distanceScore = isDistant(student.coordinates, event.coordinates);
      const interestScore = isInterested(event, student.UserInterests);
      const pastAttendanceScore = calculatePastAttendanceScore(
        event,
        pastAttendedEvents
      );

      const totalScore = calculateTotalScore(
        availabilityScore,
        distanceScore,
        interestScore,
        pastAttendanceScore,
        DEFAULT_WEIGHTS
      );
      scoredEvents.push({
        ...event,
        scores: {
          availability: availabilityScore,
          distance: distanceScore,
          interest: interestScore,
          pastAttendace: pastAttendanceScore,
          total: totalScore,
        },
      });
    }

    scoredEvents.sort((a, b) => {
      b.scores.total - a.scores.total;
    });

    const recommendedSchedule = [];
    for (const event of scoredEvents) {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);

      let hasOverlap = false;
      for (const selectedEvent of recommendedSchedule) {
        const selectedStart = new Date(selectedEvent.start_date);
        const selectedEnd = new Date(selectedEvent.end_date);

        if (eventStart < selectedEnd && eventEnd > selectedStart) {
          hasOverlap = true;
          break;
        }
      }
      if (!hasOverlap) {
        recommendedSchedule.push(event);
      }
    }
    return recommendedSchedule;
  } catch (error) {
    console.error("Error getting recommended events: ", error);
  }
}

function isParentAvailable(event, availabilityBlock) {
  if (!availabilityBlock || availabilityBlock.length === 0) {
    return false;
  }

  const eventStart = new Date(event.start_date);
  const eventEnd = new Date(event.end_date);

  for (const block of availabilityBlock) {
    const blockStart = new Date(block.start_date);
    const blockEnd = new Date(block.end_date);

    if (eventStart >= blockStart && eventEnd <= blockEnd) {
      return true;
    }
    if (eventStart < blockEnd && eventEnd > blockStart) {
      return false;
    }
  }
  return false;
}

async function initializeUserInterests(userId) {
  const defaultInterests = INTEREST_CATEGORIES.map((category) => ({
    user_id: userId,
    category: category,
    ranking: 3,
  }));

  return await prisma.userInterest.createMany({
    data: defaultInterests,
    skipDuplicates: true,
  });
}

async function createOrGetCoordinates(latitude, longitude) {
  if (!latitude || !longitude) {
    return null;
  }

  const exisitingCoordinates = await prisma.coordinates.findFirst({
    where: {
      latitude: latitude,
      longitude: longitude,
    },
  });

  if (exisitingCoordinates) {
    return exisitingCoordinates;
  }

  return await prisma.coordinates.create({
    data: {
      latitude: latitude,
      longitude: longitude,
    },
  });
}

module.exports = {
  isAvailableForEvent,
  isDistant,
  isInterested,
  calculatePastAttendanceScore,
  calculateTotalScore,
  getRecommendedEvents,
  isParentAvailable,
  initializeUserInterests,
  createOrGetCoordinates,
  calculateWeightedScore,
  SCORES,
  INTEREST_CATEGORIES,
  DEFAULT_WEIGHTS,
};
