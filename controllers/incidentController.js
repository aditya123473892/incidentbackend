const { pool } = require("../config/db");

// Map UI-facing strings → numeric values
const LIKELIHOOD_MAP = {
  "Very Low":  1,
  Low:         2,
  Medium:      3,
  High:        4,
  "Very High": 5,
};

const IMPACT_MAP = {
  "Very Low":  1,
  Low:         2,
  Medium:      3,
  High:        4,
  "Very High": 5,
};

// Risk level thresholds by score
const RISK_LEVEL = {
  1: "Low", 2: "Low", 3: "Low", 4: "Low",
  5: "Medium", 6: "Medium", 7: "Medium", 8: "Medium", 9: "Medium",
  10: "High", 11: "High", 12: "High", 13: "High", 14: "High", 15: "High", 16: "High",
  17: "Critical", 18: "Critical", 19: "Critical", 20: "Critical",
  21: "Critical", 22: "Critical", 23: "Critical", 24: "Critical", 25: "Critical",
};

function computeRisk(likelihood, impact) {
  const l = LIKELIHOOD_MAP[likelihood] ?? 1;
  const i = IMPACT_MAP[impact] ?? 1;
  const score = l * i;
  const level = RISK_LEVEL[score] ?? "Low";
  return { riskScore: score, riskLevel: level };
}

const allowedLikelihoods = Object.keys(LIKELIHOOD_MAP);
const allowedImpacts = Object.keys(IMPACT_MAP);
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const CATEGORIES = [
  "Network", "Hardware", "Software", "Security", "Database", "Application", "Other",
];

function validateIncident(data) {
  const required = [
    "incidentRefNo", "incidentDate", "incidentDetails",
    "incidentCategory", "likelihood", "impact", "priority", "status",
  ];
  for (const field of required) {
    if (!data[field]) return `${field} is required`;
  }
  if (!allowedLikelihoods.includes(data.likelihood)) return `Invalid likelihood: ${data.likelihood}`;
  if (!allowedImpacts.includes(data.impact))          return `Invalid impact: ${data.impact}`;
  if (!STATUSES.includes(data.status))                return `Invalid status: ${data.status}`;
  if (!CATEGORIES.includes(data.incidentCategory))    return `Invalid category: ${data.incidentCategory}`;
  return null;
}

const getAllIncidents = async (_req, res) => {
  try {
    const result = await pool.request().query(
      `SELECT id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
              likelihood, impact, riskScore, riskLevel, priority, rca, status, createdAt, updatedAt
         FROM Incidents
         ORDER BY srNo DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching incidents:", {
      message: err.message,
      code: err.code,
      state: err.state,
      number: err.number,
    });
    res.status(500).json({ error: "Failed to fetch incidents", details: err.message });
  }
};

const getIncidentById = async (req, res) => {
  try {
    const result = await pool.request()
      .input("id", req.params.id)
      .query(
        `SELECT id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
                likelihood, impact, riskScore, riskLevel, priority, rca, status, createdAt, updatedAt
           FROM Incidents
          WHERE id = @id`
      );
    if (result.recordset.length === 0) return res.status(404).json({ error: "Incident not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching incident:", err);
    res.status(500).json({ error: "Failed to fetch incident" });
  }
};

const createIncident = async (req, res) => {
  try {
    const valError = validateIncident(req.body);
    if (valError) return res.status(400).json({ error: valError });

    const { incidentRefNo, incidentDate, incidentDetails, incidentCategory,
            likelihood, impact, priority, rca, status } = req.body;
    const { riskScore, riskLevel } = computeRisk(likelihood, impact);

    const maxSrNo = (await pool.request()
      .query("SELECT ISNULL(MAX(srNo), 0) as maxSrNo FROM Incidents")).recordset[0].maxSrNo;
    const srNo = maxSrNo + 1;

    await pool.request()
      .input("id",               req.body.id || require("crypto").randomUUID())
      .input("srNo",             srNo)
      .input("incidentRefNo",    incidentRefNo)
      .input("incidentDate",     incidentDate)
      .input("incidentDetails",  incidentDetails)
      .input("incidentCategory", incidentCategory)
      .input("likelihood",       likelihood)
      .input("impact",           impact)
      .input("riskScore",        riskScore)
      .input("riskLevel",        riskLevel)
      .input("priority",         priority)
      .input("rca",              rca || "")
      .input("status",           status)
      .query(
        `INSERT INTO Incidents
           (id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
            likelihood, impact, riskScore, riskLevel, priority, rca, status)
         VALUES
           (@id, @srNo, @incidentRefNo, @incidentDate, @incidentDetails, @incidentCategory,
            @likelihood, @impact, @riskScore, @riskLevel, @priority, @rca, @status)`
      );

    const newIncident = (await pool.request()
      .input("id", req.body.id || require("crypto").randomUUID())
      .query(
        `SELECT id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
                likelihood, impact, riskScore, riskLevel, priority, rca, status, createdAt, updatedAt
           FROM Incidents
          WHERE id = @id`
      )).recordset[0];

    res.status(201).json(newIncident);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ error: "Failed to create incident" });
  }
};

const updateIncident = async (req, res) => {
  try {
    const valError = validateIncident(req.body);
    if (valError) return res.status(400).json({ error: valError });

    const { id } = req.params;
    const { incidentRefNo, incidentDate, incidentDetails, incidentCategory,
            likelihood, impact, priority, rca, status } = req.body;
    const { riskScore, riskLevel } = computeRisk(likelihood, impact);

    const result = await pool.request()
      .input("id",               id)
      .input("incidentRefNo",    incidentRefNo)
      .input("incidentDate",     incidentDate)
      .input("incidentDetails",  incidentDetails)
      .input("incidentCategory", incidentCategory)
      .input("likelihood",       likelihood)
      .input("impact",           impact)
      .input("riskScore",        riskScore)
      .input("riskLevel",        riskLevel)
      .input("priority",         priority)
      .input("rca",              rca || "")
      .input("status",           status)
      .query(
        `UPDATE Incidents
            SET incidentRefNo   = @incidentRefNo,
                incidentDate    = @incidentDate,
                incidentDetails = @incidentDetails,
                incidentCategory= @incidentCategory,
                likelihood      = @likelihood,
                impact          = @impact,
                riskScore       = @riskScore,
                riskLevel       = @riskLevel,
                priority        = @priority,
                rca             = @rca,
                status          = @status
          WHERE id = @id`
      );

    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: "Incident not found" });

    const updated = (await pool.request()
      .input("id", id)
      .query(
        `SELECT id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
                likelihood, impact, riskScore, riskLevel, priority, rca, status, createdAt, updatedAt
           FROM Incidents
          WHERE id = @id`
      )).recordset[0];

    res.json(updated);
  } catch (err) {
    console.error("Error updating incident:", err);
    res.status(500).json({ error: "Failed to update incident" });
  }
};

const deleteIncident = async (req, res) => {
  try {
    const result = await pool.request()
      .input("id", req.params.id)
      .query("DELETE FROM Incidents WHERE id = @id");
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: "Incident not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting incident:", err);
    res.status(500).json({ error: "Failed to delete incident" });
  }
};

module.exports = {
  getAllIncidents, getIncidentById, createIncident, updateIncident, deleteIncident,
  computeRisk,
};
