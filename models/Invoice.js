// models/Invoice.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Invoice = sequelize.define("Invoice", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  plan_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  base_amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unique_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  final_amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payload: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("pending", "paid", "expired"),
    defaultValue: "pending"
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "invoices",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

User.hasMany(Invoice, { foreignKey: "user_id" });
Invoice.belongsTo(User, { foreignKey: "user_id" });

module.exports = Invoice;
