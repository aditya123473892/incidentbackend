const { pool } = require("../config/db");

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const IMPACTS = ["Very Low", "Low", "Medium", "High", "Very High"];
const URGENCIES = ["Low", "Medium", "High"];
const CATEGORIES = ["Network", "Hardware", "Software", "Security", "Database", "Application", "Other"];

const PRIORITY_MATRIX = {
  High: { High: "Critical", Medium: "High", Low: "High" },
  Medium: { High: "High", Medium: "Medium", Low: "Medium" },
  Low: { High: "Medium", Medium: "Low", Low: "Low" },
  "Very High": { High: "Critical", Medium: "Critical", Low: "High" },
  "Very Low": { High: "Low", Medium: "Low", Low: "Low" },
};

const RESPONSE_TARGET = { Critical: 15, High: 30, Medium: 120, Low: 240 };
const RESOLUTION_TARGET = { Critical: 4, High: 8, Medium: 24, Low: 72 };

function getPriority(impact, urgency) {
  const impactKey = IMPACTS.includes(impact) ? impact : "Medium";
  const urgencyKey = URGENCIES.includes(urgency) ? urgency : "Medium";
  return PRIORITY_MATRIX[impactKey]?.[urgencyKey] || "Medium";
}

const getAllIncidents = async (_req, res) => {
  try {
    const result = await pool.request().query(
      `SELECT id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
              priority, impact, urgency, responseTarget, resolutionTarget, rca, status, createdAt, updatedAt
         FROM IncidentManagement
         ORDER BY srNo DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
};

const getIncidentById = async (req, res) => {
  try {
    const result = await pool.request()
      .input("id", req.params.id)
      .query(`SELECT id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
                     priority, impact, urgency, responseTarget, resolutionTarget, rca, status, createdAt, updatedAt
                FROM IncidentManagement WHERE id = @id`);
    if (result.recordset.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
};

const createIncident = async (req, res) => {
  try {
    const { incidentRefNo, incidentDate, incidentDetails, incidentCategory, impact, urgency, rca, status } = req.body;
    const priority = getPriority(impact, urgency);

    const maxSrNo = (await pool.request().query("SELECT ISNULL(MAX(srNo), 0) as maxSrNo FROM IncidentManagement")).recordset[0].maxSrNo;
    const srNo = maxSrNo + 1;
    const newId = req.body.id || require("crypto").randomUUID();

    await pool.request()
      .input("id", newId)
      .input("srNo", srNo)
      .input("incidentRefNo", incidentRefNo)
      .input("incidentDate", incidentDate)
      .input("incidentDetails", incidentDetails)
      .input("incidentCategory", incidentCategory)
      .input("priority", priority)
      .input("impact", impact)
      .input("urgency", urgency)
      .input("responseTarget", RESPONSE_TARGET[priority])
      .input("resolutionTarget", RESOLUTION_TARGET[priority])
      .input("rca", rca || "")
      .input("status", status)
      .query(`INSERT INTO IncidentManagement
             (id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
              priority, impact, urgency, responseTarget, resolutionTarget, rca, status)
             VALUES (@id, @srNo, @incidentRefNo, @incidentDate, @incidentDetails, @incidentCategory,
              @priority, @impact, @urgency, @responseTarget, @resolutionTarget, @rca, @status)`);

    const newIncident = (await pool.request().input("id", newId)
      .query(`SELECT id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
                     priority, impact, urgency, responseTarget, resolutionTarget, rca, status, createdAt, updatedAt
              FROM IncidentManagement WHERE id = @id`)).recordset[0];

    res.status(201).json(newIncident);
  } catch (err) {
    res.status(500).json({ error: "Failed to create" });
  }
};

const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { incidentRefNo, incidentDate, incidentDetails, incidentCategory, impact, urgency, rca, status } = req.body;
    const priority = getPriority(impact, urgency);

    await pool.request()
      .input("id", id)
      .input("incidentRefNo", incidentRefNo)
      .input("incidentDate", incidentDate)
      .input("incidentDetails", incidentDetails)
      .input("incidentCategory", incidentCategory)
      .input("priority", priority)
      .input("impact", impact)
      .input("urgency", urgency)
      .input("responseTarget", RESPONSE_TARGET[priority])
      .input("resolutionTarget", RESOLUTION_TARGET[priority])
      .input("rca", rca || "")
      .input("status", status)
      .query(`UPDATE IncidentManagement SET incidentRefNo=@incidentRefNo, incidentDate=@incidentDate,
              incidentDetails=@incidentDetails, incidentCategory=@incidentCategory, priority=@priority,
              impact=@impact, urgency=@urgency, responseTarget=@responseTarget, resolutionTarget=@resolutionTarget, rca=@rca, status=@status WHERE id=@id`);

    const updated = (await pool.request().input("id", id)
      .query(`SELECT id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
                     priority, impact, urgency, responseTarget, resolutionTarget, rca, status, createdAt, updatedAt
              FROM IncidentManagement WHERE id = @id`)).recordset[0];

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
};

const deleteIncident = async (req, res) => {
  try {
    await pool.request().input("id", req.params.id).query("DELETE FROM IncidentManagement WHERE id = @id");
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
};

module.exports = { getAllIncidents, getIncidentById, createIncident, updateIncident, deleteIncident };