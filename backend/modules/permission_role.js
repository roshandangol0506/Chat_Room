const mongoose = require("mongoose");

const permission_role = new mongoose.Schema(
  {
    permission_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "permission",
      required: true,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "role",
      required: true,
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Permission_Role = mongoose.model("permission_role", permission_role);

module.exports = Permission_Role;
