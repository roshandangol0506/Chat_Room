const mongoose = require("mongoose");

const newCategory = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("category", newCategory);

module.exports = Category;
