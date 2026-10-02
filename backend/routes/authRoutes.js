const express = require("express");

const router = express.Router();

const {
    register,
    login,
    getProfile,
    updateProfile,
    getUsers
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");


// ============================================================
// REGISTER & LOGIN
// ============================================================

router.post("/register", register);
router.post("/login", login);


// ============================================================
// PROFILE
// ============================================================

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);


// ============================================================
// USERS
// ============================================================

router.get("/users", authMiddleware, getUsers);

router.get("/test", (req, res) => {
    res.json({ message: "Auth route is working" });
});


module.exports = router;