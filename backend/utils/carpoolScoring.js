const SCORING_WEIGHTS = {
  distance: 0.4,
  duration: 0.35,
  passenger: 0.25,
};

const SCORING_THRESHOLDS = {
  distance: {
    excellent: { max: 5, score: 100 },
    good: { max: 15, score: 80 },
    fair: { max: 30, score: 60 },
    poor: { max: 50, score: 40 },
    veryPoor: { max: Infinity, score: 20 },
  },
  duration: {
    excellent: { max: 10, score: 100 },
    good: { max: 25, score: 80 },
    fair: { max: 45, score: 60 },
    poor: { max: 75, score: 40 },
    veryPoor: { max: Infinity, score: 20 },
  },
  passenger: {
    max: { max: 2, score: 100 },
    good: { max: 1, score: 70 },
    poor: { max: 0, score: 30 },
  },
};

function calculateDistanceScore(distance) {
  if (distance === Infinity || distance <= 0) return 0;

  const thresholds = SCORING_THRESHOLDS.distance;
  if (distance <= thresholds.excellent.max) return thresholds.excellent.score;
  if (distance <= thresholds.good.max) return thresholds.good.score;
  if (distance <= thresholds.fair.max) return thresholds.fair.score;
  if (distance <= thresholds.poor.max) return thresholds.poor.score;

  return thresholds.veryPoor.score;
}

function calculateDurationScore(duration) {
  if (duration === Infinity || duration <= 0) return 0;

  const thresholds = SCORING_THRESHOLDS.duration;
  if (duration <= thresholds.excellent.max) return thresholds.excellent.score;
  if (duration <= thresholds.good.max) return thresholds.good.score;
  if (duration <= thresholds.fair.max) return thresholds.fair.score;
  if (duration <= thresholds.poor.max) return thresholds.poor.score;

  return thresholds.veryPoor.score;
}

function calculatePassengerScore(passengerCount) {
  if (passengerCount === Infinity || passengerCount <= 0) return 0;

  const thresholds = SCORING_THRESHOLDS.passenger;
  if (passengerCount >= thresholds.max.max) return thresholds.max.score;
  if (passengerCount >= thresholds.good.max) return thresholds.good.score;
  return thresholds.poor.score;
}

function calculateTotalScore(distance, duration, passengerCount) {
  const distanceScore = calculateDistanceScore(distance);
  const durationScore = calculateDurationScore(duration);
  const passengerScore = calculatePassengerScore(passengerCount);

  const weightedScore =
    distanceScore * SCORING_WEIGHTS.distance +
    durationScore * SCORING_WEIGHTS.duration +
    passengerScore * SCORING_WEIGHTS.passenger;

  return {
    distanceScore,
    durationScore,
    passengerScore,
    totalScore: Math.round(weightedScore * 100) / 100,
  };
}

module.exports = {
  calculateDistanceScore,
  calculateDurationScore,
  calculatePassengerScore,
  calculateTotalScore,
  SCORING_THRESHOLDS,
  SCORING_WEIGHTS,
};
