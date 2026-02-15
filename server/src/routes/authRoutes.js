const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);

module.exports = router;