const Permission = require("../modules/permission");

async function handleGetPermission(req, res) {
  const data = await Permission.find();
  res.json({ data, user: req.user });
}

async function handleGeneratePermission(req, res) {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newPermission = new Permission({ name, slug });
    await newPermission.save();
    return res.status(200).json({ message: "Permission Added Successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add Permission" });
  }
}

async function handleEditPermission(req, res) {
  try {
    const { permission_id } = req.params;
    const { name, slug } = req.body;

    const permission = await Permission.findById(permission_id);
    if (!permission) {
      return res.status(404).json({ error: "permission not found" });
    }
    console.log(name);
    console.log(slug);
    console.log(permission.slug);
    if (name) permission.name = name;
    if (slug) permission.slug = slug;

    await permission.save();
    return res
      .status(200)
      .json({ message: "permission updated successfully", permission });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update permission" });
  }
}

module.exports = {
  handleGetPermission,
  handleGeneratePermission,
  handleEditPermission,
};
