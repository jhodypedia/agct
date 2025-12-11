// routes/admin.js
const express = require("express");
const router = express.Router();
const { User, Site, GlobalSetting } = require("../models");
const { normalizeBasePayloadFromFull } = require("../utils/qris");

// Admin dashboard
router.get("/", async (req, res) => {
  const usersCount = await User.count();
  const sitesCount = await Site.count();
  const activeSitesCount = await Site.count({ where: { status: "active" } });

  res.render("admin/index", {
    title: "Admin Overview",
    usersCount,
    sitesCount,
    activeSitesCount
  });
});

// Admin sites
router.get("/sites", async (req, res) => {
  const sites = await Site.findAll({
    include: [{ model: User }],
    order: [["created_at", "DESC"]]
  });
  res.render("admin/sites", {
    title: "Sites",
    sites
  });
});

// Update site status
router.post("/sites/:id/status", async (req, res) => {
  try {
    const site = await Site.findByPk(req.params.id);
    if (!site) return res.json({ success: false, message: "Site not found" });
    const { status } = req.body;
    await site.update({ status });
    res.json({ success: true, message: "Status updated" });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error updating status" });
  }
});

// Update site template
router.post("/sites/:id/template", async (req, res) => {
  try {
    const site = await Site.findByPk(req.params.id);
    if (!site) return res.json({ success: false, message: "Site not found" });
    const { template } = req.body;
    await site.update({ template });
    res.json({ success: true, message: "Template updated" });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error updating template" });
  }
});

// TMDB settings
router.get("/settings/tmdb", async (req, res) => {
  const setting = await GlobalSetting.findOne({ where: { name: "TMDB_API_KEY" } });
  res.render("admin/settings_tmdb", {
    title: "TMDB Settings",
    tmdbKey: setting ? setting.value : ""
  });
});

router.post("/settings/tmdb", async (req, res) => {
  try {
    const { tmdbKey } = req.body;
    await GlobalSetting.upsert({
      name: "TMDB_API_KEY",
      value: tmdbKey.trim()
    });
    res.json({ success: true, message: "TMDB key saved" });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error saving TMDB key" });
  }
});

// QRIS settings
router.get("/settings/qris", async (req, res) => {
  const rawPayloadSetting = await GlobalSetting.findOne({ where: { name: "QRIS_RAW_PAYLOAD" } });
  const basePayloadSetting = await GlobalSetting.findOne({ where: { name: "QRIS_BASE_PAYLOAD" } });

  res.render("admin/settings_qris", {
    title: "QRIS Settings",
    qrisRaw: rawPayloadSetting ? rawPayloadSetting.value : "",
    qrisBase: basePayloadSetting ? basePayloadSetting.value : ""
  });
});

router.post("/settings/qris", async (req, res) => {
  try {
    const { qrisPayload } = req.body;
    if (!qrisPayload || !qrisPayload.trim()) {
      return res.json({ success: false, message: "QRIS payload tidak boleh kosong" });
    }

    const raw = qrisPayload.trim();
    const normalizedBase = normalizeBasePayloadFromFull(raw);

    if (!normalizedBase) {
      return res.json({
        success: false,
        message: "Gagal normalisasi payload. Pastikan payload benar."
      });
    }

    await GlobalSetting.upsert({ name: "QRIS_RAW_PAYLOAD", value: raw });
    await GlobalSetting.upsert({ name: "QRIS_BASE_PAYLOAD", value: normalizedBase });

    res.json({
      success: true,
      message: "QRIS payload disimpan. Sistem akan gunakan base payload ini untuk QR dinamis."
    });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Server error" });
  }
});

module.exports = router;
