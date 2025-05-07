const mongoose = require("mongoose");

const role_user = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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

const Role_User = mongoose.model("role_user", role_user);

module.exports = Role_User;
