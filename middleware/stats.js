// middleware/stats.js
const { SiteVisit } = require("../models");

async function statsLogger(req, res, next) {
  try {
    const site = req.currentSite;
    if (!site) return next();
    if (req.method !== "GET") return next();

    const path = req.path || req.originalUrl || "/";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"] || "";

    await SiteVisit.create({
      site_id: site.id,
      path,
      ip: String(ip || "").slice(0, 100),
      user_agent: String(ua || "").slice(0, 255)
    });

    next();
  } catch (e) {
    console.error("statsLogger error:", e);
    next();
  }
}

module.exports = { statsLogger };
