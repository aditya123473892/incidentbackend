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

router.get("/", authenticateToken, requireRole("risk"), getAllIncidents);
router.get("/:id", authenticateToken, requireRole("risk"), getIncidentById);
router.post("/", authenticateToken, requireRole("risk"), createIncident);
router.put("/:id", authenticateToken, requireRole("risk"), updateIncident);
router.delete("/:id", authenticateToken, requireAdmin, deleteIncident);

module.exports = router;
