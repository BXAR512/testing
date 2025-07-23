const express = require("express");
const axios = require("axios");

const router = express.Router();

const MAPBOX_API_BASE = "https://api.mapbox.com/directions/v5/mapbox/driving";

const SECOND_IN_HOUR = 3600;
const MINS_IN_HOUR = 60;
const METERS_IN_MILE = 0.000623;

router.get("/directions", async (request, response) => {
  try {
    const { origin, destination } = request.query;

    if (!origin || !destination) {
      return response.status(400).json({
        error: "origin and destination required",
      });
    }

    const token = process.env.MAPBOX_ACCESS_TOKEN;
    const url = `${MAPBOX_API_BASE}/${origin};${destination}`;

    const res = await axios.get(url, {
      params: {
        access_token: token,
        geometries: "geojson",
        overview: "full",
        steps: true,
      },
    });

    const route = res.data.routes[0];

    const result = {
      duration: Math.round(route.duration),
      distance: Math.round(route.distance),
      duration_formatted: formatDuration(route.duration),
      distance_formatted: formatDistance(route.distance),
      steps: route.legs[0].steps.map((step) => ({
        instruction: step.maneuver.instruction,
        distance: Math.round(step.distance),
        duration: Math.round(step.duration),
      })),
    };
    response.json(result);
  } catch (error) {
    response.status(500).json({
      error: "Failed to get directions!",
    });
  }
});

function formatDuration(seconds) {
  const hours = Math.floor(seconds / SECOND_IN_HOUR);
  const minutes = Math.floor((seconds % SECOND_IN_HOUR) / MINS_IN_HOUR);
  if (hours > 0) {
    return `${hours} h ${minutes} m`;
  }
  return `${minutes} m`;
}

function formatDistance(meters) {
  const miles = meters * METERS_IN_MILE;
  if (miles >= 1) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(meters)} m`;
}

module.exports = router;
