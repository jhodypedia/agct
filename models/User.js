// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(190),
    allowNull: false,
    unique: true
  },
  nohp: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("free", "premium"),
    defaultValue: "free"
  },
  role: {
    type: DataTypes.ENUM("user", "admin"),
    defaultValue: "user"
  },
  plan: {
    type: DataTypes.ENUM("free", "pro"),
    defaultValue: "free"
  },
  billing_status: {
    type: DataTypes.ENUM("none", "pending", "paid"),
    defaultValue: "none"
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "users",
  timestamps: false
});

// helper hash password
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

module.exports = User;
