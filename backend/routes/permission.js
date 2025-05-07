const express = require("express");
const {
  handleGeneratePermission,
  handleGetPermission,
  handleEditPermission,
} = require("../controllers/permission");
const {
  restrictToLoggedinAdminOnly,
  checkAuth,
} = require("../middleware.js/auth");

const router = express.Router();

router.get("/permission", restrictToLoggedinAdminOnly, handleGetPermission);
router.post("/addpermission", handleGeneratePermission);
router.put("/editpermission/:permission_id", handleEditPermission);

module.exports = router;
