// models/GlobalSetting.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GlobalSetting = sequelize.define("GlobalSetting", {
  name: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "global_settings",
  timestamps: false
});

module.exports = GlobalSetting;
