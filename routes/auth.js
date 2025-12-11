// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User } = require("../models");

// Login form
router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("auth/login", { error: null });
});

// Login POST
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render("auth/login", { error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("auth/login", { error: "Invalid email or password" });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      plan: user.plan
    };

    res.redirect("/dashboard");
  } catch (e) {
    console.error(e);
    res.render("auth/login", { error: "Server error" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
});

module.exports = router;
