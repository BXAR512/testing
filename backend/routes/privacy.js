const express = require("express");
const router = express.Router();
const PrivacyRequest = require("../handler/privacyRequest");
const PrivacyHandlerCreator = require("../handler/privacyActionHandler");

// Get privacy settings for the current user
router.get("/settings", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const request = new PrivacyRequest("view_profile", req.session.userId, req.session.userId);
    const handler = PrivacyHandlerCreator.createSpecificHandler("view_profile");
    const response = await handler.process(request);

    if (response.success) {
      res.json(response.data);
    } else {
      res.status(403).json({ error: response.reason });
    }
  } catch (error) {
    console.error("Error getting privacy settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update privacy settings for the current user
router.put("/settings", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { isAnon, anonUsername } = req.body;

    // Validate input
    if (typeof isAnon !== "boolean") {
      return res.status(400).json({ error: "isAnon must be a boolean" });
    }

    if (isAnon && (!anonUsername || typeof anonUsername !== "string" || anonUsername.trim() === "")) {
      return res.status(400).json({ error: "Anonymous username is required when isAnon is true" });
    }

    const PrivacyService = require("../service/privacyService");
    const privacyService = new PrivacyService();

    const updatedSettings = await privacyService.updatePrivacySettings(req.session.userId, {
      isAnon,
      anonUsername: anonUsername || null,
    });

    if (updatedSettings) {
      res.json(updatedSettings);
    } else {
      res.status(500).json({ error: "Failed to update privacy settings" });
    }
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get event attendees with privacy filtering
router.get("/event/:eventId/attendees", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const request = new PrivacyRequest("view_attendees", req.session.userId);
    request.addContext("eventId", eventId);

    const handler = PrivacyHandlerCreator.createSpecificHandler("view_attendees");
    const response = await handler.process(request);

    if (response.success) {
      res.json(response.data);
    } else {
      res.status(403).json({ error: response.reason });
    }
  } catch (error) {
    console.error("Error getting event attendees:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get carpool participants for an event
router.get("/event/:eventId/carpool", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const request = new PrivacyRequest("view_carpool", req.session.userId);
    request.addContext("eventId", eventId);

    const handler = PrivacyHandlerCreator.createSpecificHandler("view_carpool");
    const response = await handler.process(request);

    if (response.success) {
      res.json(response.data);
    } else {
      res.status(403).json({ error: response.reason });
    }
  } catch (error) {
    console.error("Error getting carpool participants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user schedule with privacy filtering
router.get("/user/:userId/schedule", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const targetUserId = parseInt(req.params.userId);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const request = new PrivacyRequest("view_schedule", req.session.userId, targetUserId);

    const handler = PrivacyHandlerCreator.createSpecificHandler("view_schedule");
    const response = await handler.process(request);

    if (response.success) {
      res.json(response.data);
    } else {
      res.status(403).json({ error: response.reason });
    }
  } catch (error) {
    console.error("Error getting user schedule:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
