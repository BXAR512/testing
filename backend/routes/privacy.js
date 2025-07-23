const express = require("express");
const { PrismaClient } = require("../generated/prisma");
const PrivacyService = require("../service/privacyService");

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
    const {
      profileVisibility,
      friendVisibility,
      eventVisibility,
      isAnon,
      anonUsername,
    } = request.body;
    const settings = await privacyService.updatePrivacySettings(
      request.session.userId,
      {
        profileVisibility,
        friendVisibility,
        eventVisibility,
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

router.post("/block/:userId", requireAuth, async (request, response) => {
  try {
    const userToBlockId = parseInt(request.params.userId);

    if (userToBlockId === request.session.userId) {
      return response.status(400).json({
        message: "Can't block yourself",
      });
    }

    const result = await privacyService.blockUser(
      request.session.userId,
      userToBlockId
    );
    response.json(result);
  } catch (error) {
    console.error("Error blocking user", error);
    response.status(500).json({
      message: "Error blocking user!",
    });
  }
});

router.delete("/block/:userId", requireAuth, async (request, response) => {
  try {
    const userToUnblockId = parseInt(request.params.userId);

    const result = await privacyService.unblockUser(
      request.session.userId,
      userToUnblockId
    );
    response.json(result);
  } catch (error) {
    console.error("Error unblocking user", error);
    response.status(500).json({
      message: "Error unblocking user!",
    });
  }
});

router.get("/blocked", requireAuth, async (request, response) => {
  try {
    const blockedUsers = await privacyService.getBlockedUsers(
      request.session.userId
    );

    response.json({ blockedUsers });
  } catch (error) {
    console.error("Error getting blocked users", error);
    response.status(500).json({
      message: "Error getting blocked users!",
    });
  }
});

router.get(
  "/friend/:friendId/settings",
  requireAuth,
  async (request, response) => {
    try {
      const friendId = parseInt(request.params.friendId);
      const settings = await privacyService.getFriendPrivacySettings(
        request.session.userId,
        friendId
      );

      if (!settings) {
        return response.status(404).json({
          message: "Friend not found or settings not accessible",
        });
      }
      response.json({ settings });
    } catch (error) {
      console.error("Error getting friend privacy settings", error);
      response.status(500).json({
        message: "Error getting friend privacy settings",
      });
    }
  }
);
module.exports = router;
