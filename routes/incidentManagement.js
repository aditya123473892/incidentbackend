const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin, requireRole } = require("../middleware/auth");
const {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
} = require("../controllers/incidentManagementController");

router.get("/", authenticateToken, requireRole("incident"), getAllIncidents);
router.get("/:id", authenticateToken, requireRole("incident"), getIncidentById);
router.post("/", authenticateToken, requireRole("incident"), createIncident);
router.put("/:id", authenticateToken, requireRole("incident"), updateIncident);
router.delete("/:id", authenticateToken, requireAdmin, deleteIncident);

module.exports = router;
