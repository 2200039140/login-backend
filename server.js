// BACKEND: server.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
require("dotenv").config()
// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI||"mongodb://mongo:gKvOnETLuIZADKQhPJsuvyXxNPDQMsYd@interchange.proxy.rlwy.net:22933", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log("✅ MongoDB Connected(vercel/railway)");
    console.log(" Using DB URI:", process.env.MONGO_URI || "default hardcoded one");
  })



// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["student", "admin"], default: "student" },
  course: String,
  grade: String,
});
const User = mongoose.model("User123", userSchema);

// Middleware: verify token
function authMiddleware(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "No token provided" });
  jwt.verify(token, "secret123", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, course, grade } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role, course, grade });
    await user.save();
    res.json({ message: "User Registered Successfully" });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id, role: user.role }, "secret123", { expiresIn: "1h" });
  res.json({ token, role: user.role, name: user.name });
});

// Get Profile
app.get("/profile", authMiddleware, async (req, res) => {
  if (req.user.role === "admin") {
    const users = await User.find({}, "-password"); // hide password
    return res.json(users);
  } else {
    const user = await User.findById(req.user.id, "-password");
    return res.json(user);
  }
});

// Start Server
const PORT = process.env.PORT || 5000; // ✅ Railway will override PORT
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
