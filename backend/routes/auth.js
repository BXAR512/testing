const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const exisitingUser = await prisma.user.findUnique({
      where: { username: username },
    });

    if (exisitingUser) {
      return res.status(400).json({
        message: "Username is already taken.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
    });

    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    req.session.role = newUser.role;

    res.status(201).json({
      message: "New user created",
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong with signup!" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      message: "Login Successful",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({ message: "Something went wrong with login!" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "Logout went wrong!",
      });
    }
    res.json({
      message: "Logout successful",
    });
  });
});

router.get("/me", (req, res) => {
  if (req.session.userId) {
    res.json({
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role,
      },
    });
  } else {
    res.status(401).json({
      message: "Not authenticated",
    });
  }
});

module.exports = router;
