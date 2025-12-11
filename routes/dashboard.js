// routes/dashboard.js
const express = require("express");
const router = express.Router();
const { Op, fn, col, literal } = require("sequelize");
const QRCode = require("qrcode");

const { Site, User, GlobalSetting, SiteVisit, Invoice } = require("../models");
const { requireProUser } = require("../middleware/plan");
const { buildPayloadWithAmount, generateUniqueAmount } = require("../utils/qris");

// My Sites
router.get("/", async (req, res) => {
  const sites = await Site.findAll({
    where: { user_id: req.session.user.id },
    order: [["created_at", "DESC"]]
  });

  res.render("dashboard/index", {
    title: "My Sites",
    sites
  });
});

// Create site (PRO only)
router.post("/sites", requireProUser, async (req, res) => {
  try {
    const { domain, template, title, tagline } = req.body;

    await Site.create({
      user_id: req.session.user.id,
      domain,
      template,
      title,
      tagline,
      status: "pending_dns"
    });

    res.json({ success: true, message: "Site created, set DNS A record to server IP." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error creating site" });
  }
});

// Update site basic info
router.post("/sites/:id/update", requireProUser, async (req, res) => {
  try {
    const site = await Site.findOne({
      where: {
        id: req.params.id,
        user_id: req.session.user.id
      }
    });
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    const { title, tagline, logo_url, meta_description } = req.body;
    await site.update({ title, tagline, logo_url, meta_description });

    res.json({ success: true, message: "Site updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Error updating site" });
  }
});

// Billing page
router.get("/billing", async (req, res) => {
  const user = await User.findByPk(req.session.user.id);

  const base = await GlobalSetting.findOne({ where: { name: "QRIS_BASE_PAYLOAD" } });
  const raw = await GlobalSetting.findOne({ where: { name: "QRIS_RAW_PAYLOAD" } });

  const lastInvoice = await Invoice.findOne({
    where: { user_id: user.id },
    order: [["created_at", "DESC"]]
  });

  res.render("dashboard/billing", {
    title: "Billing",
    user,
    qrisBase: base ? base.value : "",
    qrisRaw: raw ? raw.value : "",
    lastInvoice
  });
});

// Generate QR + invoice
router.post("/billing/generate", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { baseAmount, planName } = req.body;

    const amountInt = parseInt(baseAmount, 10);
    if (isNaN(amountInt) || amountInt <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const base = await GlobalSetting.findOne({ where: { name: "QRIS_BASE_PAYLOAD" } });
    if (!base || !base.value) {
      return res.status(500).json({
        success: false,
        message: "QRIS base payload not configured"
      });
    }

    const { uniqueCode, finalAmount } = generateUniqueAmount(amountInt);
    const fullPayload = buildPayloadWithAmount(base.value, finalAmount);

    const invoice = await Invoice.create({
      user_id: userId,
      plan_name: planName || "pro",
      base_amount: amountInt,
      unique_code: uniqueCode,
      final_amount: finalAmount,
      payload: fullPayload,
      status: "pending"
    });

    const qrDataUrl = await QRCode.toDataURL(fullPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 256
    });

    return res.json({
      success: true,
      invoiceId: invoice.id,
      amount: finalAmount,
      uniqueCode,
      payload: fullPayload,
      qrDataUrl
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Confirm payment
router.post("/billing/confirm", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { invoiceId } = req.body;

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, user_id: userId }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    if (invoice.status === "paid") {
      return res.json({ success: true, message: "Invoice already paid" });
    }

    await invoice.update({ status: "paid" });

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let newPlan = "pro";
    await user.update({
      plan: newPlan,
      billing_status: "paid"
    });

    req.session.user.plan = newPlan;

    return res.json({
      success: true,
      message: `Payment confirmed. Plan upgraded to ${newPlan.toUpperCase()}.`
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Ads config
router.get("/ads", requireProUser, async (req, res) => {
  const userId = req.session.user.id;
  const sites = await Site.findAll({
    where: { user_id: userId },
    order: [["created_at", "ASC"]]
  });

  if (!sites.length) {
    return res.render("dashboard/ads", {
      title: "Ads Settings",
      site: null,
      sites,
      ads: { top: "", incontent: "", sidebar: "" }
    });
  }

  const selectedId = req.query.siteId || sites[0].id;
  const site = sites.find(s => String(s.id) === String(selectedId)) || sites[0];

  let ads = { top: "", incontent: "", sidebar: "" };
  if (site && site.ads_config) {
    try { ads = JSON.parse(site.ads_config); } catch (e) {}
  }

  res.render("dashboard/ads", {
    title: "Ads Settings",
    site,
    sites,
    ads
  });
});

router.post("/ads/save", requireProUser, async (req, res) => {
  try {
    const { siteId, top, incontent, sidebar } = req.body;
    const site = await Site.findOne({
      where: { id: siteId, user_id: req.session.user.id }
    });
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    const ads_config = JSON.stringify({ top, incontent, sidebar });
    await site.update({ ads_config });

    res.json({ success: true, message: "Ads updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Stats
router.get("/stats", async (req, res) => {
  const userId = req.session.user.id;

  const sites = await Site.findAll({
    where: { user_id: userId },
    order: [["created_at", "ASC"]]
  });

  if (!sites.length) {
    return res.render("dashboard/stats", {
      title: "Statistics",
      site: null,
      sites,
      stats: null,
      topPaths: [],
      chartData: null,
      startDateStr: "",
      endDateStr: ""
    });
  }

  const selectedId = req.query.siteId || sites[0].id;
  const site = sites.find(s => String(s.id) === String(selectedId)) || sites[0];

  let startDate;
  let endDate;

  if (req.query.start && req.query.end) {
    startDate = new Date(req.query.start + "T00:00:00");
    endDate = new Date(req.query.end + "T23:59:59");
  } else {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
  }

  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  const totalViews = await SiteVisit.count({ where: { site_id: site.id } });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayViews = await SiteVisit.count({
    where: { site_id: site.id, created_at: { [Op.gte]: todayStart } }
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate((new Date()).getDate() - 6);

  const sevenDaysViews = await SiteVisit.count({
    where: { site_id: site.id, created_at: { [Op.gte]: sevenDaysAgo } }
  });

  const topPaths = await SiteVisit.findAll({
    attributes: ["path", [fn("COUNT", "*"), "views"]],
    where: {
      site_id: site.id,
      created_at: { [Op.between]: [startDate, endDate] }
    },
    group: ["path"],
    order: [[literal("views"), "DESC"]],
    limit: 10
  });

  const visitsPerDayRaw = await SiteVisit.findAll({
    attributes: [[fn("DATE", col("created_at")), "day"], [fn("COUNT", "*"), "views"]],
    where: {
      site_id: site.id,
      created_at: { [Op.between]: [startDate, endDate] }
    },
    group: [literal("day")],
    order: [[literal("day"), "ASC"]]
  });

  const tmpMap = {};
  visitsPerDayRaw.forEach(row => {
    const dayStr = row.get("day");
    const views = Number(row.get("views")) || 0;
    tmpMap[dayStr] = views;
  });

  const chartLabels = [];
  const chartValues = [];

  const loopDate = new Date(startDate);
  while (loopDate <= endDate) {
    const dStr = loopDate.toISOString().slice(0, 10);
    chartLabels.push(dStr);
    chartValues.push(tmpMap[dStr] || 0);
    loopDate.setDate(loopDate.getDate() + 1);
  }

  const stats = { totalViews, todayViews, sevenDaysViews };
  const chartData = { labels: chartLabels, values: chartValues };

  res.render("dashboard/stats", {
    title: "Statistics",
    site,
    sites,
    stats,
    topPaths,
    chartData,
    startDateStr,
    endDateStr
  });
});

// Invoices list
router.get("/invoices", async (req, res) => {
  const userId = req.session.user.id;

  const invoices = await Invoice.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]]
  });

  res.render("dashboard/invoices", {
    title: "My Invoices",
    invoices
  });
});

module.exports = router;
