const express = require("express");
const { PrismaClient } = require("../generated/prisma");
const PrivacyService = require("../service/privacyService");
const PrivacyRequest = require("../handler/privacyRequest");
const PrivacyHandlerCreator = require("../handler/privacyActionHandler");

const privacyService = new PrivacyService();

const prisma = new PrismaClient();
const router = express.Router();

const requireAuth = (request, response, next) => {
  if (!request.session.userId) {
    return response.status(401).json({
      message: "Authentication required",
    });
  }
  next();
};

router.get("/settings", requireAuth, async (request, response) => {
  try {
    let settings = await privacyService.getPrivacySettings(
      request.session.userId
    );

    if (!settings) {
      settings = await privacyService.createPrivacySettings(
        request.session.userId
      );
    }
    return response.json({ settings });
  } catch (error) {
    console.error("Error getting privacy settings", error);
    response.status(501).json({
      message: "Error getting privacy settings",
    });
  }
});

router.put("/settings", requireAuth, async (request, response) => {
  try {
    const { isAnon, anonUsername } = request.body;
    const settings = await privacyService.updatePrivacySettings(
      request.session.userId,
      {
        isAnon,
        anonUsername,
      }
    );
    response.json({ settings, message: "Settings were updated" });
  } catch (error) {
    console.error("Error updating privacy settings", error);
    response.status(501).json({
      message: "Error updating privacy settings",
    });
  }
});

router.get(
  "/event/:eventId/attendees",
  requireAuth,
  async (request, response) => {
    try {
      const eventId = parseInt(request.params.eventId);
      const requesterId = request.session.userId;

      const privacyRequest = new PrivacyRequest(
        requesterId,
        null,
        "view_attendees",
        "View event attendees"
      );

      privacyRequest.setContext("eventId", eventId);

      const handler =
        PrivacyHandlerCreator.createSpecificHandler("view_attendees");

      const result = await handler.process(privacyRequest);

      if (result.handled) {
        if (result.response.allowed) {
          response.json({
            success: true,
            attendees: result.response.data,
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
          nessage: "Failed to process request",
        });
      }
    } catch (error) {
      console.error("Error viewing event attendees:", error);
      response.status(500).json({
        success: false,
        message: "Error viewing event attendees",
      });
    }
  }
);

module.exports = router;
