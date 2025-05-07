const express = require("express");
const { handleAdminSignup, handleAdminLogin } = require("../controllers/admin");

const router = express.Router();

router.post("/adminsignup", handleAdminSignup);
router.post("/adminlogin", handleAdminLogin);

module.exports = router;
