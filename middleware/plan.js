// middleware/plan.js

function requireProUser(req, res, next) {
  const user = req.session.user;
  if (!user) return res.redirect("/auth/login");
  if (user.plan !== "pro") {
    return res.status(403).json({
      success: false,
      message: "Pro plan required"
    });
  }
  next();
}

module.exports = { requireProUser };
