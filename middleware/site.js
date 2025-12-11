// middleware/site.js
const { Site } = require("../models");

/**
 * Attach currentSite based on hostname
 */
async function siteLoader(req, res, next) {
  try {
    const host = req.hostname.toLowerCase();

    const site = await Site.findOne({
      where: { domain: host, status: "active" }
    });

    req.currentSite = site || null;
    res.locals.site = site || null;
    next();
  } catch (e) {
    console.error("siteLoader error:", e);
    req.currentSite = null;
    res.locals.site = null;
    next();
  }
}

module.exports = { siteLoader };
