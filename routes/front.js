// routes/front.js
const express = require("express");
const router = express.Router();
const { tmdbGet } = require("../utils/tmdb");
const { seoDefaults } = require("../middleware/seo");
const { Site } = require("../models");

router.use(seoDefaults);

// Home by template
router.get("/", async (req, res) => {
  const site = req.currentSite;
  if (!site) {
    // kalau tidak ada site untuk hostname ini, boleh tampilkan landing panel
    return res.render("front/no_site", {
      title: "No site configured",
      seo: res.locals.seo
    });
  }

  try {
    const [trending, popularMovies, popularTv, topRated, genres] = await Promise.all([
      tmdbGet("/trending/all/day"),
      tmdbGet("/movie/popular"),
      tmdbGet("/tv/popular"),
      tmdbGet("/movie/top_rated"),
      tmdbGet("/genre/movie/list")
    ]);

    let view;
    if (site.template === "cinema_hero") view = "front/template_cinema_hero";
    else if (site.template === "blog_magazine") view = "front/template_blog_magazine";
    else view = "front/template_stream_classic";

    let ads = { top: "", incontent: "", sidebar: "" };
    if (site.ads_config) {
      try { ads = JSON.parse(site.ads_config); } catch (e) {}
    }

    res.locals.seo.title = site.title || "Movies & TV";
    if (site.meta_description) res.locals.seo.description = site.meta_description;

    res.render(view, {
      title: site.title || "Home",
      site,
      trending,
      popularMovies,
      popularTv,
      topRated,
      genres,
      ads
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Error loading TMDB data");
  }
});

// Movie detail
router.get("/movie/:id", async (req, res) => {
  const site = req.currentSite;
  if (!site) return res.status(404).send("Not found");

  try {
    const movie = await tmdbGet(`/movie/${req.params.id}`, {
      append_to_response: "videos,similar"
    });

    let ads = { top: "", incontent: "", sidebar: "" };
    if (site.ads_config) {
      try { ads = JSON.parse(site.ads_config); } catch (e) {}
    }

    res.locals.seo.title = movie.title + " - " + (site.title || "");
    res.locals.seo.description = movie.overview || res.locals.seo.description;

    res.render("front/movie_detail", {
      title: movie.title,
      movie,
      ads
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Error loading movie");
  }
});

// TV detail
router.get("/tv/:id", async (req, res) => {
  const site = req.currentSite;
  if (!site) return res.status(404).send("Not found");

  try {
    const tv = await tmdbGet(`/tv/${req.params.id}`, {
      append_to_response: "videos,similar"
    });

    let ads = { top: "", incontent: "", sidebar: "" };
    if (site.ads_config) {
      try { ads = JSON.parse(site.ads_config); } catch (e) {}
    }

    res.locals.seo.title = tv.name + " - " + (site.title || "");
    res.locals.seo.description = tv.overview || res.locals.seo.description;

    res.render("front/tv_detail", {
      title: tv.name,
      tv,
      ads
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Error loading tv");
  }
});

// Search
router.get("/search", async (req, res) => {
  const site = req.currentSite;
  if (!site) return res.status(404).send("Not found");

  const q = (req.query.q || "").trim();

  if (!q) {
    return res.render("front/search", {
      title: "Search",
      query: "",
      results: null
    });
  }

  try {
    const results = await tmdbGet("/search/multi", { query: q, include_adult: false });

    res.locals.seo.title = `Search "${q}" - ` + (site.title || "");
    res.locals.seo.description = `Search results for ${q}`;

    res.render("front/search", {
      title: "Search",
      query: q,
      results
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Error searching");
  }
});

// Discover by genre
router.get("/discover", async (req, res) => {
  const site = req.currentSite;
  if (!site) return res.status(404).send("Not found");

  const genre = req.query.genre || "";
  const page = parseInt(req.query.page || "1", 10);

  try {
    const [genres, discover] = await Promise.all([
      tmdbGet("/genre/movie/list"),
      tmdbGet("/discover/movie", {
        with_genres: genre || undefined,
        page
      })
    ]);

    res.locals.seo.title = "Discover - " + (site.title || "");
    res.locals.seo.description = "Discover movies by genre";

    res.render("front/discover", {
      title: "Discover",
      genres,
      discover,
      activeGenre: genre,
      page
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Error discover");
  }
});

module.exports = router;
