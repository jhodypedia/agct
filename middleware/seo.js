// middleware/seo.js

function seoDefaults(req, res, next) {
  const site = res.locals.site;
  const baseTitle = site && site.title ? site.title : "TMDB SaaS";
  const description = site && site.meta_description
    ? site.meta_description
    : "Watch and explore movies & TV shows powered by TMDB.";

  res.locals.seo = {
    title: baseTitle,
    description,
    image: site && site.logo_url ? site.logo_url : "",
    url: req.protocol + "://" + req.get("host") + req.originalUrl,
    type: "website"
  };

  next();
}

module.exports = { seoDefaults };
