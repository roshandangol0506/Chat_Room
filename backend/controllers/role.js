const Role = require("../modules/role");

async function handleGetRole(req, res) {
  const data = await Role.find();
  res.json(data);
}

async function handleGenerateRole(req, res) {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newRole = new Role({ name, slug });
    await newRole.save();
    return res.status(200).json({ message: "Role Added Successful" });
  } catch (error) {
    return res.status(500).json({ error: "Error creating role" });
  }
}

async function handleEditRole(req, res) {
  try {
    const { role_id } = req.params;
    const { name, slug } = req.body;

    const role = await Role.findById(role_id);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    if (name) role.name = name;
    if (slug) role.slug = slug;

    await role.save();
    return res.status(200).json({ message: "Role updated successfully", role });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update Role" });
  }
}

module.exports = { handleGetRole, handleGenerateRole, handleEditRole };
