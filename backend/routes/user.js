const express = require("express");
const {
  handleUserSignup,
  handleEditProfileUser,
  handleGetUser,
  handleUserLogin,
  handleUserLogout,
  handleChangeUserPassword,
} = require("../controllers/user");
const { restrictToLoggedinUserOnly } = require("../middleware.js/auth");

const router = express.Router();

router.get("/user", handleGetUser);
router.post("/usersignup", handleUserSignup);
router.put("/edituser/:user_id", handleEditProfileUser);
router.put("/edituserpassword/:user_id", handleChangeUserPassword);
router.post("/userlogin", handleUserLogin);
router.get("/userlogout", handleUserLogout);

module.exports = router;
