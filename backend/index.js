const express = require("express");
const session = require("express-session");
const cors = require("cors");

const app = express();
const PORT = 3000;

const authRoutes = require("./routes/auth");
const mapboxRoutes = require("./routes/mapbox");
const rankRoutes = require("./routes/ranking");
const carpoolRoutes = require("./routes/carpool");
const privacyRoutes = require("./routes/privacy");

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    secret: "codepath-sera",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 },
  })
);

app.use(authRoutes);
app.use("/api", mapboxRoutes);
app.use("/api", rankRoutes);
app.use("/carpool", carpoolRoutes);
app.use("/privacy", privacyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Welcome to Sera!");
});
