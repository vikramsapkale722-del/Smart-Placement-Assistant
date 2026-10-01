const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const memoryStore = require("../config/memoryStore");

// Helper: Calculate profile completion percentage
const calculateCompletion = (user) => {
  if (!user) return 0;
  if (user.role === "company") {
    const fields = ["fullName", "email", "phone", "companyName", "website", "location", "industry", "bio"];
    let filled = 0;
    fields.forEach((f) => {
      if (user[f] && user[f].toString().trim().length > 0) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  }

  const studentFields = [
    "fullName",
    "email",
    "phone",
    "college",
    "degree",
    "branch",
    "graduationYear",
    "cgpa",
    "skills",
    "projects",
    "certifications",
    "experience",
    "github",
    "linkedin",
  ];

  let filled = 0;
  studentFields.forEach((f) => {
    const val = user[f];
    if (Array.isArray(val) && val.length > 0) filled++;
    else if (val && val.toString().trim().length > 0) filled++;
  });
  return Math.round((filled / studentFields.length) * 100);
};

// ==========================================
// Register User
// POST /api/auth/register
// ==========================================
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role = "student",
      phone,
      college,
      degree,
      branch,
      graduationYear,
      cgpa,
      companyName,
      website,
      location,
      industry,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields (Full Name, Email, Password)",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Security: Public registration only allows student and company roles
    const validRole = ["student", "company"].includes(role) ? role : "student";

    // 1. Atlas Database Mode
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "An account already exists with this email address.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: validRole,
        phone: phone || "",
        college: college || "",
        degree: degree || "",
        branch: branch || "",
        graduationYear: graduationYear || "",
        cgpa: cgpa || "",
        companyName: companyName || (validRole === "company" ? fullName.trim() : ""),
        website: website || "",
        location: location || "",
        industry: industry || "",
      });

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "smartplacement_secret_2026", {
        expiresIn: "7d",
      });

      const safeUser = user.toObject();
      delete safeUser.password;
      safeUser.profileCompletion = calculateCompletion(safeUser);

      return res.status(201).json({
        success: true,
        message: "Registration successful!",
        token,
        user: safeUser,
      });
    }

    // 2. Resilient In-Memory Mode
    const existingMemUser = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingMemUser) {
      return res.status(400).json({
        success: false,
        message: "An account already exists with this email address.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newId = "user_" + Date.now();
    const newMemUser = {
      _id: newId,
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: validRole,
      phone: phone || "",
      college: college || "",
      degree: degree || "",
      branch: branch || "",
      graduationYear: graduationYear || "",
      cgpa: cgpa || "",
      companyName: companyName || (validRole === "company" ? fullName.trim() : ""),
      website: website || "",
      location: location || "",
      industry: industry || "",
      skills: [],
      projects: "",
      certifications: "",
      experience: "",
      github: "",
      linkedin: "",
      portfolio: "",
      bio: "",
      createdAt: new Date(),
    };

    memoryStore.users.push(newMemUser);

    const token = jwt.sign({ id: newId, role: validRole }, process.env.JWT_SECRET || "smartplacement_secret_2026", {
      expiresIn: "7d",
    });

    const { password: _, ...safeUser } = newMemUser;
    safeUser.profileCompletion = calculateCompletion(safeUser);

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed due to server error",
    });
  }
};

// ==========================================
// Login User
// POST /api/auth/login
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Atlas Database Mode
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "smartplacement_secret_2026", {
        expiresIn: "7d",
      });

      const safeUser = user.toObject();
      delete safeUser.password;
      safeUser.profileCompletion = calculateCompletion(safeUser);

      return res.status(200).json({
        success: true,
        message: "Login successful!",
        token,
        user: safeUser,
      });
    }

    // 2. Resilient In-Memory Mode
    const memUser = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!memUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, memUser.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ id: memUser._id, role: memUser.role }, process.env.JWT_SECRET || "smartplacement_secret_2026", {
      expiresIn: "7d",
    });

    const { password: _, ...safeUser } = memUser;
    safeUser.profileCompletion = calculateCompletion(safeUser);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed due to server error",
    });
  }
};

// ==========================================
// Get Logged In User
// GET /api/auth/me
// ==========================================
exports.getMe = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      const userObj = user.toObject();
      userObj.profileCompletion = calculateCompletion(userObj);
      return res.status(200).json({
        success: true,
        user: userObj,
      });
    }

    // Resilient memory mode
    const memUser = memoryStore.users.find((u) => u._id === userId || u._id.toString() === userId.toString());
    if (!memUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const { password, ...safeUser } = memUser;
    safeUser.profileCompletion = calculateCompletion(safeUser);
    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving profile",
    });
  }
};

// ==========================================
// Update Profile
// PUT /api/auth/profile
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const allowedFields = [
      "fullName",
      "phone",
      "college",
      "degree",
      "branch",
      "graduationYear",
      "cgpa",
      "skills",
      "projects",
      "certifications",
      "experience",
      "github",
      "linkedin",
      "portfolio",
      "bio",
      "companyName",
      "website",
      "location",
      "industry",
    ];

    const updateFields = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        if (key === "skills") {
          updateFields.skills = Array.isArray(req.body.skills)
            ? req.body.skills
            : req.body.skills.split(",").map((s) => s.trim()).filter(Boolean);
        } else {
          updateFields[key] = req.body[key];
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid fields to update",
      });
    }

    // 1. Atlas Database Mode
    if (mongoose.connection.readyState === 1) {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userObj = user.toObject();
      userObj.profileCompletion = calculateCompletion(userObj);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully!",
        user: userObj,
      });
    }

    // 2. Resilient In-Memory Mode
    const userIndex = memoryStore.users.findIndex((u) => u._id === userId || u._id.toString() === userId.toString());
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    Object.assign(memoryStore.users[userIndex], updateFields);
    const { password, ...safeUser } = memoryStore.users[userIndex];
    safeUser.profileCompletion = calculateCompletion(safeUser);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: safeUser,
    });
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// ==========================================
// Get All Users (Admin)
// GET /api/auth/users
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};

    if (mongoose.connection.readyState === 1) {
      const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    }

    let users = memoryStore.users.map(({ password, ...u }) => u);
    if (role) {
      users = users.filter((u) => u.role === role);
    }

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("GetAllUsers Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
};