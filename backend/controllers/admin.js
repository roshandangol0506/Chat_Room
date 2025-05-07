const Admin = require("../modules/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.SESSION_SECRET;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function handleAdminSignup(req, res) {
  try {
    const body = req.body;
    const parsedData = signupSchema.safeParse(body);

    if (!parsedData.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { email, password } = parsedData.data;

    console.log("Email:", email);
    console.log("Password:", password);

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Hashed Password:", hashedPassword);

    const newAdmin = new Admin({ email, password: hashedPassword });

    try {
      await newAdmin.save();
      return res.status(200).json({ message: "Admin Signup Successful" });
    } catch (saveError) {
      console.error("Error saving admin:", saveError);
      return res
        .status(500)
        .json({ error: "Database error: " + saveError.message });
    }
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ error: "Failed to signup admin" });
  }
}

async function handleAdminLogin(req, res) {
  try {
    const body = req.body;

    const parsedData = loginSchema.safeParse(body);
    if (!parsedData.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { email, password } = parsedData.data;
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const payload = { email: admin.email, id: admin._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Admin Login Successful", token });
  } catch (error) {
    console.error("Login API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { handleAdminSignup, handleAdminLogin };
