// models/SiteVisit.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Site = require("./Site");

const SiteVisit = sequelize.define("SiteVisit", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  site_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ip: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "site_visits",
  timestamps: false
});

Site.hasMany(SiteVisit, { foreignKey: "site_id" });
SiteVisit.belongsTo(Site, { foreignKey: "site_id" });

module.exports = SiteVisit;
