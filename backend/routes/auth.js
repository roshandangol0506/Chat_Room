const express = require("express");
const {
  restrictToLoggedinAdminOnly,
  checkAuth,
  restrictToLoggedinUserOnly,
} = require("../middleware.js/auth");

const router = express.Router();

router.post("/restrictToLoggedinAdminOnly", restrictToLoggedinAdminOnly);
router.get("/checkAuth", checkAuth);
router.post("/restrictToLoggedinUserOnly", restrictToLoggedinUserOnly);

module.exports = router;
