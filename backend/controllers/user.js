const User = require("../modules/user");
const { setUser } = require("../service/auth");
const { v4: uuidv4 } = require("uuid");

async function handleGetUser(req, res) {
  const data = await User.find();
  res.json({ data: data });
}

async function handleUserSignup(req, res) {
  try {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: "All Fields are Required" });
    }

    const newUser = new User({ name, email, username, password });
    await newUser.save();
    return res.status(200).json({ message: "User Signup Successful", newUser });
  } catch (error) {
    return res.status(500).json({ error: "Failed to signup User" });
  }
}

async function handleEditProfileUser(req, res) {
  try {
    const { user_id } = req.params;
    const { email, name } = req.body;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (email) user.email = email;
    if (name) user.name = name;

    await user.save();

    const userUid = req.cookies?.uid;
    if (userUid) {
      setUser(userUid, user);
    }
    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update user" });
  }
}

async function handleChangeUserPassword(req, res) {
  try {
    const { user_id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.password !== currentPassword) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    if (newPassword) user.password = newPassword;
    await user.save();

    return res
      .status(200)
      .json({ message: "User password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ error: "Failed to update user password" });
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  const sessionId = uuidv4();
  setUser(sessionId, { ...user.toObject(), role: user.role });
  res.cookie("uid", sessionId, { httpOnly: true, secure: false });
  return res.status(200).json({ message: "Login successful" });
}

async function handleUserLogout(req, res) {
  res.clearCookie("uid");
  return res.status(200).json({ message: "Logged out Successfully" });
}

module.exports = {
  handleGetUser,
  handleUserSignup,
  handleEditProfileUser,
  handleUserLogin,
  handleUserLogout,
  handleChangeUserPassword,
};
