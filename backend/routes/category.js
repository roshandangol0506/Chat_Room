const express = require("express");
const {
  handlegetCategory,
  handleGenerateCategory,
  handleDeleteCategory,
  handleEditCategory,
} = require("../controllers/category");

const router = express.Router();

router.get("/category", handlegetCategory);
router.post("/addcategory", handleGenerateCategory);
router.put("/editcategory/:category_id", handleEditCategory);
router.delete("/deletecategory/:category_id", handleDeleteCategory);

module.exports = router;
