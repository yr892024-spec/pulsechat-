const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const {
    findUserByEmail,
    findUserById,
    createUser,
    getAllUsers
} = require("../models/userModel");


// ============================================================
// REGISTER
// ============================================================

const register = async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await createUser(
            name,
            email,
            hashedPassword
        );

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: result.insertId,
                name,
                email
            }
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            message: "Server error"
        });
    }

};


// ============================================================
// LOGIN
// ============================================================

const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profile_image: user.profile_image,
                bio: user.bio || "Available",
                status: user.status
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Server error"
        });
    }

};


// ============================================================
// GET PROFILE
// ============================================================

const getProfile = async (req, res) => {

    try {

        const user = await findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user
        });

    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({
            message: "Server error"
        });
    }

};


// ============================================================
// UPDATE PROFILE
// ============================================================

const updateProfile = async (req, res) => {

    try {

        const userId = req.user.id;
        const { name, bio, profile_image } = req.body;

        const sql = `
            UPDATE users
            SET
                name = COALESCE(?, name),
                bio = COALESCE(?, bio),
                profile_image = COALESCE(?, profile_image)
            WHERE id = ?
        `;

        db.query(sql, [name || null, bio || null, profile_image || null, userId], (err) => {
            if (err) {
                console.error("Profile update error:", err);
                return res.status(500).json({ message: "Profile update failed" });
            }

            db.query(`SELECT id, name, email, profile_image, bio, status FROM users WHERE id = ?`, [userId], (qErr, rows) => {
                if (qErr || !rows || rows.length === 0) {
                    return res.status(200).json({ message: "Profile updated" });
                }

                res.status(200).json({
                    message: "Profile updated successfully",
                    user: rows[0]
                });
            });
        });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error" });
    }

};


// ============================================================
// GET ALL USERS
// ============================================================

const getUsers = async (req, res) => {

    try {

        const currentUserId = req.user.id;
        const users = await getAllUsers(currentUserId);

        res.status(200).json({
            users
        });

    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            message: "Server error"
        });
    }

};


module.exports = {

    register,
    login,
    getProfile,
    updateProfile,
    getUsers

};