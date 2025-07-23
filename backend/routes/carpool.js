const express = require("express");
const { getCarpoolRoutes, getOptimalRoute } = require("../utils/carpoolUtils");

const router = express.Router();

router.get("/routes/:eventId/:userId", async (request, response) => {
  try {
    const { eventId, userId } = request.params;

    if (!eventId || !userId) {
      return response.status(400).json({
        error: "Event ID and User ID are required",
      });
    }

    const routes = await getCarpoolRoutes(parseInt(eventId), parseInt(userId));

    response.json({
      data: routes,
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to get carpool routes.",
    });
  }
});

router.get("/optimization/:eventId/:userId", async (request, response) => {
  try {
    const { eventId, userId } = request.params;

    if (!eventId || !userId) {
      return response.status(400).json({
        error: "Event ID and User ID are required",
      });
    }

    const route = await getOptimalRoute(parseInt(eventId), parseInt(userId));

    response.json({
      data: route,
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to get carpool routes.",
    });
  }
});

router.post("/cache/clear", async (request, response) => {
  try {
    const { clearAllCaches } = require("../utils/cacheUtil");

    clearAllCaches();

    response.json({
      message: "Cache cleared",
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to clear cache.",
    });
  }
});

module.exports = router;
