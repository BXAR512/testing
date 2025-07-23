const express = require("express");
const router = express.Router();
const { getRecommendedEvents } = require("../utils/rankingUtils");

router.get("/recommendations/:studentId", async (request, response) => {
  try {
    const { studentId } = request.params;
    const { parentId } = request.query;

    const recommendations = await getRecommendedEvents(
      parseInt(studentId),
      parentId ? parseInt(parentId) : null
    );
    response.json({
      data: recommendations,
    });
  } catch (error) {
    console.error("Error getting recommendations");
    response.status(500).json({
      error: "Failed to get recommendations",
      message: error.message,
    });
  }
});

module.exports = router;
