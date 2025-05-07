const express = require("express");
const {
  handleGivePermissiontoRole,
  handleDeletePermissiontoRole,
} = require("../controllers/permission_role");

const router = express.Router();

router.post("/permission_role", handleGivePermissiontoRole);
router.delete(
  "/delete_permission_role/:permission_role_id",
  handleDeletePermissiontoRole
);

module.exports = router;
