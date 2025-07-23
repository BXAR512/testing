const express = require("express");
const { PrismaClient } = require("../generated/prisma");
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

router.get("/", requireAuth, async (request, response) => {
  try {
    const userId = request.session.userId;

    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { user_id: userId, status: "accepted" },
          { friend_id: userId, status: "accepted" },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        friend: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    const friendList = friends.map((friend) => {
      if (friend.user_id === userId) {
        return {
          id: friend.friend.id,
          username: friend.friend.username,
          role: friend.friend.role,
          friendId: friend.id,
        };
      } else {
        return {
          id: friend.user.id,
          username: friend.user.username,
          role: friend.user.role,
          friendId: friend.id,
        };
      }
    });
    response.json({ friends: friendList });
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch friend list" });
  }
});

router.get("/pending", requireAuth, async (request, response) => {
  try {
    const userId = request.session.userId;

    const pendingRequests = await prisma.friend.findMany({
      where: {
        friend_id: userId,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    const requests = pendingRequests.map((req) => ({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      friendId: req.id,
    }));
    response.json({ requests });
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch pending request" });
  }
});

router.post("/request", requireAuth, async (request, response) => {
  try {
    const { friendUsername } = request.body;
    const userId = request.session.userId;

    const friend = await prisma.user.findUnique({
      where: { username: friendUsername },
    });

    if (!friend) {
      return response.status(404).json({ message: "User not found" });
    }

    if (friend === userId) {
      return response.status(400).json({ message: "Can't add yourself" });
    }

    const exisitingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { user_id: userId, friend_id: friend.id },
          { user_id: friend.id, friend_id: userId },
        ],
      },
    });

    if (exisitingFriend) {
      return response
        .status(400)
        .json({ message: "Friend request already sent" });
    }

    const newFriend = await prisma.friend.create({
      data: {
        user_id: userId,
        friend_id: friend.id,
        status: "pending",
      },
    });

    response.status(201).json({
      friendship: newFriend,
    });
  } catch (error) {
    response.status(500).json({
      message: "Failed to send request",
    });
  }
});

router.put("/accept/:friendId", requireAuth, async (request, response) => {
  try {
    const { friendId } = request.params;
    const userId = request.session.userId;

    const friend = await prisma.friend.findFirst({
      where: {
        id: parseInt(friendId),
        friend_id: userId,
        status: "pending",
      },
    });

    if (!friend) {
      return response.status(404).json({ message: "Friend request not found" });
    }
    await prisma.friend.update({
      where: { id: parseInt(friendId) },
      data: { status: "accepted" },
    });
    response.json({ message: "Friend request acccepted" });
  } catch (error) {
    response.json({ message: "Could not accept" });
  }
});

router.delete("/:friendId", requireAuth, async (request, response) => {
  try {
    const { friendId } = request.params;
    const userId = request.session.userId;

    const friend = await prisma.friend.findFirst({
      where: {
        id: parseInt(friendId),
        OR: [{ user_id: userId }, { friend_id: userId }],
      },
    });
    if (!friend) {
      return response.status(404).json({ message: "Friend not found" });
    }

    await prisma.friend.delete({
      where: { id: parseInt(friendId) },
    });

    response.json({ message: "Friend removed" });
  } catch (error) {
    response.status(500).json({ message: "Error removing friend" });
  }
});

module.exports = router;
