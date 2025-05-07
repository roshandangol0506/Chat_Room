const Role_User = require("../modules/role_user");

async function handleSetRoletoUser(req, res) {
  try {
    const { user_id, role_id } = req.body;
    if (!user_id || !role_id) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingRole = await Role_User.findOne({ user_id, role_id });

    if (existingRole) {
      return res
        .status(400)
        .json({ message: "Role is already assigned to this user" });
    }

    const newRole_User = new Role_User({ user_id, role_id });
    await newRole_User.save();

    return res.status(201).json({ message: "Successfully set Role to User" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to set Role to User" });
  }
}

module.exports = { handleSetRoletoUser };
