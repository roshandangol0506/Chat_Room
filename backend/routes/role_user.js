const express = require("express");
const { handleSetRoletoUser } = require("../controllers/role_user");

const router = express.Router();

router.post("/role_user", handleSetRoletoUser);

module.exports = router;
