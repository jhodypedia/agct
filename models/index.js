// models/index.js
const sequelize = require("../config/database");
const User = require("./User");
const Site = require("./Site");
const GlobalSetting = require("./GlobalSetting");
const SiteVisit = require("./SiteVisit");
const Invoice = require("./Invoice");

module.exports = {
  sequelize,
  User,
  Site,
  GlobalSetting,
  SiteVisit,
  Invoice
};
