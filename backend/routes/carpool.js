const express = require("express");
const { getCarpoolRoutes, getOptimalRoute } = require("../utils/carpoolUtils");
const CarpoolService = require("../service/carpoolService");
const PrivacyRequest = require("../handler/privacyRequest");
const PrivacyHandlerCreator = require("../handler/privacyActionHandler");

const carpoolService = new CarpoolService();

const router = express.Router();

const requireAuth = (request, response, next) => {
  if (!request.session.userId) {
    return response.status(401).json({
      message: "Authentication required",
    });
  }
  next();
};

router.get("/routes/:eventId/:userId", requireAuth, async (request, response) => {
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

router.get("/optimization/:eventId/:userId", requireAuth, async (request, response) => {
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

router.post("/cache/clear", requireAuth, async (request, response) => {
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

// New carpool endpoint following privacy pattern
router.get(
  "/event/:eventId/participants",
  requireAuth,
  async (request, response) => {
    try {
      const eventId = parseInt(request.params.eventId);
      const requesterId = request.session.userId;

      const privacyRequest = new PrivacyRequest(
        requesterId,
        null,
        "view_carpool",
        "View carpool participants"
      );

      privacyRequest.setContext("eventId", eventId);

      const handler = PrivacyHandlerCreator.createSpecificHandler("view_carpool");

      const result = await handler.process(privacyRequest);

      if (result.handled) {
        if (result.response.allowed) {
          response.json({
            success: true,
            participants: result.response.data,
            handler: result.response.handler,
            reason: result.response.result,
          });
        } else {
          response.status(403).json({
            success: false,
            message: result.response.reason,
            handler: result.response.handler,
          });
        }
      } else {
        response.status(500).json({
          success: false,
          message: "Failed to process request",
        });
      }
    } catch (error) {
      console.error("Error viewing carpool participants:", error);
      response.status(500).json({
        success: false,
        message: "Error viewing carpool participants",
      });
    }
  }
);

// Get carpool display name for a user
router.get("/user/:userId/display-name", requireAuth, async (request, response) => {
  try {
    const userId = parseInt(request.params.userId);
    const requesterId = request.session.userId;

    const displayName = await carpoolService.getCarpoolDisplayName(userId);
    
    response.json({
      success: true,
      displayName,
      userId,
    });
  } catch (error) {
    console.error("Error getting carpool display name:", error);
    response.status(500).json({
      success: false,
      message: "Error getting carpool display name",
    });
  }
});

// Check if user can view carpool participants for an event
router.get("/event/:eventId/can-view", requireAuth, async (request, response) => {
  try {
    const eventId = parseInt(request.params.eventId);
    const requesterId = request.session.userId;

    const canView = await carpoolService.canViewCarpoolParticipants(
      requesterId,
      eventId
    );

    response.json({
      success: true,
      canView,
      eventId,
      requesterId,
    });
  } catch (error) {
    console.error("Error checking carpool view permissions:", error);
    response.status(500).json({
      success: false,
      message: "Error checking carpool view permissions",
    });
  }
});

module.exports = router;
