const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin, requireRole } = require("../middleware/auth");
const {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  uploadSupportingDoc,
  viewSupportingDoc,
  approveIncident,
} = require("../controllers/incidentController");

router.get("/", authenticateToken, requireRole("risk", "user"), getAllIncidents);
router.get("/:id/supporting-doc", authenticateToken, requireAdmin, viewSupportingDoc);
router.get("/:id", authenticateToken, requireRole("risk", "user"), getIncidentById);
router.post("/", authenticateToken, requireRole("risk", "user"), createIncident);
router.post(
  "/:id/supporting-doc",
  authenticateToken,
  requireRole("risk", "user"),
  express.raw({ type: "application/octet-stream", limit: "10mb" }),
  uploadSupportingDoc,
);
router.put("/:id/approve", authenticateToken, requireAdmin, approveIncident);
router.put("/:id", authenticateToken, requireRole("risk", "user"), updateIncident);
router.delete("/:id", authenticateToken, requireAdmin, deleteIncident);

module.exports = router;
