const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn("⚠️ MONGODB_URI is not set in backend/.env. Running with Resilient Memory Store.");
            return;
        }

        mongoose.connection.on("connected", () => {
            console.log("✅ MongoDB Connection Established to Atlas");
        });

        mongoose.connection.on("error", (err) => {
            console.warn("⚠️ MongoDB Atlas Runtime Error:", err.message);
        });

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        await seedAtlasDemoUsers();
    } catch (error) {
        console.warn("⚠️ MongoDB Atlas is not reachable:", error.message);
        console.warn(
            "💡 Tip: If using MongoDB Atlas, please ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP Address -> Allow Access from Anywhere: 0.0.0.0/0)."
        );
        console.log("🛡️ Resilient Memory Store activated automatically. All endpoints are fully functional!");
    }
};

async function seedAtlasDemoUsers() {
    try {
        const User = require("../models/User");
        const bcrypt = require("bcryptjs");

        // Seed Admin
        const adminExists = await User.findOne({ email: "admin@placement.edu" });
        if (!adminExists) {
            const adminPass = await bcrypt.hash("admin123", 10);
            await User.create({
                fullName: "Placement Officer (Admin)",
                email: "admin@placement.edu",
                password: adminPass,
                role: "admin",
                phone: "+91 98765 43210",
            });
            console.log("🌱 Seeded default Admin user in Atlas (admin@placement.edu)");
        }

        // Seed Recruiter
        const companyExists = await User.findOne({ email: "recruiter@google.com" });
        if (!companyExists) {
            const companyPass = await bcrypt.hash("company123", 10);
            await User.create({
                fullName: "Google India Recruiter",
                email: "recruiter@google.com",
                password: companyPass,
                role: "company",
                companyName: "Google India",
                website: "https://careers.google.com",
                location: "Bengaluru / Hyderabad",
                industry: "Technology / Software",
                phone: "+91 80 6721 0000",
                bio: "Google's mission is to organize the world's information and make it universally accessible and useful.",
            });
            console.log("🌱 Seeded default Recruiter user in Atlas (recruiter@google.com)");
        }

        // Seed Student
        const studentExists = await User.findOne({ email: "vedant@student.edu" });
        if (!studentExists) {
            const studentPass = await bcrypt.hash("student123", 10);
            await User.create({
                fullName: "Vedant Patil",
                email: "vedant@student.edu",
                password: studentPass,
                role: "student",
                phone: "+91 91234 56789",
                college: "Government College of Engineering",
                degree: "B.Tech",
                branch: "Computer Engineering",
                graduationYear: "2026",
                cgpa: "8.9",
                skills: ["JavaScript", "Node.js", "Express", "MongoDB", "Python", "Data Structures"],
                projects: "Smart Placement Assistant, AI Portfolio, E-Commerce Platform",
                certifications: "AWS Cloud Practitioner, Full Stack Web Development",
                experience: "Frontend Developer Intern at TechCorp (3 months)",
                github: "https://github.com/vedantpatil",
                linkedin: "https://linkedin.com/in/vedantpatil",
            });
            console.log("🌱 Seeded default Student user in Atlas (vedant@student.edu)");
        }
    } catch (err) {
        console.warn("⚠️ Demo users seeding notice:", err.message);
    }
}

module.exports = connectDB;

