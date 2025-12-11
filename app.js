// app.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const engine = require("ejs-mate");

const { sequelize } = require("./models");
const { siteLoader } = require("./middleware/site");
const { statsLogger } = require("./middleware/stats");
const { requireLogin, requireAdmin } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const dashboardRoutes = require("./routes/dashboard");
const frontRoutes = require("./routes/front");

const app = express();

// View engine
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static
app.use("/public", express.static(path.join(__dirname, "public")));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
const store = new SequelizeStore({ db: sequelize });

app.use(
  session({
    secret: process.env.SESSION_SECRET || "changeme",
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

// Init session store
store.sync();

// Locals user
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Site loader (by hostname)
app.use(siteLoader);

// Auth routes
app.use("/auth", authRoutes);

// Admin routes
app.use("/admin", requireLogin, requireAdmin, adminRoutes);

// Dashboard routes
app.use("/dashboard", requireLogin, dashboardRoutes);

// Front routes (multi-tenant) + stats logger
app.use("/", statsLogger, frontRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// Start server
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    // Optional: sync (hati-hati di production)
    // await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  } catch (e) {
    console.error("Unable to connect to DB:", e);
    process.exit(1);
  }
})();
