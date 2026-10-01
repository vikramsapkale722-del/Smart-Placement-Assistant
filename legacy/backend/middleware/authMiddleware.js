const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const memoryStore = require("../config/memoryStore");

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized. No token provided.",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "smartplacement_secret_2026");

        // Resolve user details
        if (mongoose.connection.readyState === 1) {
            const user = await User.findById(decoded.id).select("-password");
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User account no longer exists.",
                });
            }
            req.user = user;
        } else {
            // Memory Store fallback
            const user = memoryStore.users.find((u) => u._id === decoded.id || u._id.toString() === decoded.id.toString());
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User account no longer exists in session.",
                });
            }
            const { password, ...safeUser } = user;
            req.user = safeUser;
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: User role '${req.user ? req.user.role : "unknown"}' is not authorized to access this resource.`,
            });
        }
        next();
    };
};