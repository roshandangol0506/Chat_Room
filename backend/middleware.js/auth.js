const { getUser } = require("../service/auth");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.SESSION_SECRET;

async function restrictToLoggedinUserOnly(req, res, next) {
  const userUid = req.cookies?.uid;
  if (!userUid) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = getUser(userUid);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = user;
  next();
}

async function restrictToLoggedinAdminOnly(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

async function checkAuth(req, res) {
  const userUid = req.cookies?.uid;
  const user = getUser(userUid);

  if (!user) {
    return res.status(200).json({ isAuthenticated: false });
  }

  console.log(user.name);

  return res.status(200).json({
    isAuthenticated: true,
    userId: user._id,
    username: user.name,
    email: user.email,
  });
}

module.exports = {
  restrictToLoggedinAdminOnly,
  checkAuth,
  restrictToLoggedinUserOnly,
};
