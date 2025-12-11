// utils/tmdb.js
const axios = require("axios");
const { GlobalSetting } = require("../models");

async function getApiKey() {
  // Cek dari GlobalSetting dulu, fallback ke env
  const setting = await GlobalSetting.findOne({ where: { name: "TMDB_API_KEY" } });
  if (setting && setting.value) return setting.value;
  if (process.env.TMDB_API_KEY) return process.env.TMDB_API_KEY;
  throw new Error("TMDB API Key not configured");
}

async function tmdbGet(path, params = {}) {
  const apiKey = await getApiKey();
  const url = `https://api.themoviedb.org/3${path}`;
  const res = await axios.get(url, {
    params: { api_key: apiKey, language: "en-US", ...params }
  });
  return res.data;
}

module.exports = {
  tmdbGet
};
