const express = require("express");
const router = express.Router();
const { signup, login, me } = require("../controllers/authController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticateToken, me);

/**
 * Incident routes can be optionally guarded:
 *   unauthenticated  →  read-only (GET), write denied
 *   admin+           →  full write access
 * Use protect() + requireAdmin on POST/PUT/DELETE when ready to lock down.
 */

module.exports = router;
