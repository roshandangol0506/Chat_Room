const Category = require("../modules/category");

async function handlegetCategory(req, res) {
  try {
    const category = await Category.find({});
    if (!category) res.status(404).json({ message: "No category found" });
    res.json({ data: category });
  } catch (error) {
    res.status(500).json({ error: "Failed to add Permission" });
  }
}

async function handleGenerateCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Please provide name and description" });
    }
    const category = new Category({ name, description });
    await category.save();
    return res.status(200).json({ message: "Category Added Successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add Category" });
  }
}

async function handleEditCategory(req, res) {
  try {
    const { category_id } = req.params;

    const { name, description } = req.body;
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(404).json({ error: "category not found" });
    }
    if (name) category.name = name;
    if (description) category.description = description;

    await category.save();
    return res
      .status(200)
      .json({ message: "category updated successfully", category });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update category" });
  }
}

async function handleDeleteCategory(req, res) {
  try {
    const { category_id } = req.params;
    const category = await Category.findByIdAndDelete(category_id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch {
    return res.status(500).json({ error: "Failed to delete category" });
  }
}

module.exports = {
  handlegetCategory,
  handleGenerateCategory,
  handleEditCategory,
  handleDeleteCategory,
};
