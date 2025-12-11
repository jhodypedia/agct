// models/Site.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Site = sequelize.define("Site", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  domain: {
    type: DataTypes.STRING(190),
    allowNull: false,
    unique: true
  },
  template: {
    type: DataTypes.ENUM("stream_classic", "cinema_hero", "blog_magazine"),
    defaultValue: "stream_classic"
  },
  title: {
    type: DataTypes.STRING(190),
    allowNull: true
  },
  tagline: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  logo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ads_config: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("pending_dns", "active", "disabled"),
    defaultValue: "pending_dns"
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "sites",
  timestamps: false
});

User.hasMany(Site, { foreignKey: "user_id" });
Site.belongsTo(User, { foreignKey: "user_id" });

module.exports = Site;
