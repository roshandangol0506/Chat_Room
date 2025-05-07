const Permission_Role = require("../modules/permission_role");

async function handleGivePermissiontoRole(req, res) {
  try {
    const { permission_id, role_id } = req.body;
    if (!permission_id || !role_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingPermission = await Permission_Role.findOne({
      role_id,
      permission_id,
    });

    if (existingPermission) {
      return res
        .status(400)
        .json({ message: "Permission is already assigned to this Role" });
    }

    const newPermission_Role = new Permission_Role({ permission_id, role_id });
    await newPermission_Role.save();
    return res
      .status(200)
      .json({ message: "Successfully Give Permission to Role" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to give permission to Role" });
  }
}

async function handleDeletePermissiontoRole(req, res) {
  try {
    const { permission_role_id } = req.params;
    const permission_role = await Permission_Role.findByIdAndDelete(
      permission_role_id
    );
    if (!permission_role) {
      return res.status(404).json({ error: "Cannot Find Permission_Role" });
    }
    return res
      .status(200)
      .json({ message: "Permission Role Deleted Successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to Delete Permission Role" });
  }
}

module.exports = { handleGivePermissiontoRole, handleDeletePermissiontoRole };
