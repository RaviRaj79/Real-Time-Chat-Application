const express = require("express");
const authMiddleware = require("../middleware/auth");
const userController = require("../controllers/userController");

const router = express.Router();

router.use(authMiddleware);

router.get("/search", userController.searchUsers);
router.patch("/me", userController.updateProfile);

module.exports = router;