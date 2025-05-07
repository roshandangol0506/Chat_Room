const mongoose = require("mongoose");

const newRole = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Role = mongoose.model("role", newRole);

module.exports = Role;
