const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin, requireRole } = require("../middleware/auth");
const {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
} = require("../controllers/incidentController");

router.get("/", authenticateToken, requireRole("risk", "user"), getAllIncidents);
router.get("/:id", authenticateToken, requireRole("risk", "user"), getIncidentById);
router.post("/", authenticateToken, requireRole("risk", "user"), createIncident);
router.put("/:id", authenticateToken, requireRole("risk", "user"), updateIncident);
router.delete("/:id", authenticateToken, requireAdmin, deleteIncident);

module.exports = router;
