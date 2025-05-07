const express = require("express");
const {
  handleGenerateRole,
  handleGetRole,
  handleEditRole,
} = require("../controllers/role");
const { restrictToLoggedinAdminOnly } = require("../middleware.js/auth");

const router = express.Router();

router.get("/role", restrictToLoggedinAdminOnly, handleGetRole);
router.post("/addrole", handleGenerateRole);
router.put("/editrole/:role_id", handleEditRole);

module.exports = router;
