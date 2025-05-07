const mongoose = require("mongoose");

const newPermission = new mongoose.Schema(
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

const Permission = mongoose.model("permission", newPermission);

module.exports = Permission;
