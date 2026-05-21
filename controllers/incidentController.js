const { pool, sql } = require("../config/db");

const INCIDENT_COLUMNS = `id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
              likelihood, impact, riskScore, riskLevel, priority, rca, status,
              supportingDocName, supportingDocMime, adminSupportingDocName, adminSupportingDocMime,
              createdByEmail, createdByName, approvalStatus, verifiedByEmail, verifiedByName,
              approvedByEmail, approvedByName, approvedAt, createdAt, updatedAt`;

function generateRiskRefNo(srNo) {
  return `RSK-${String(srNo).padStart(3, "0")}`;
}

async function ensureIncidentColumns() {
  await pool.request().query(`
    IF COL_LENGTH('Incidents', 'supportingDocName') IS NULL
      ALTER TABLE Incidents ADD supportingDocName NVARCHAR(255) NULL;
    IF COL_LENGTH('Incidents', 'supportingDocMime') IS NULL
      ALTER TABLE Incidents ADD supportingDocMime NVARCHAR(150) NULL;
    IF COL_LENGTH('Incidents', 'supportingDocData') IS NULL
      ALTER TABLE Incidents ADD supportingDocData VARBINARY(MAX) NULL;
    IF COL_LENGTH('Incidents', 'adminSupportingDocName') IS NULL
      ALTER TABLE Incidents ADD adminSupportingDocName NVARCHAR(255) NULL;
    IF COL_LENGTH('Incidents', 'adminSupportingDocMime') IS NULL
      ALTER TABLE Incidents ADD adminSupportingDocMime NVARCHAR(150) NULL;
    IF COL_LENGTH('Incidents', 'adminSupportingDocData') IS NULL
      ALTER TABLE Incidents ADD adminSupportingDocData VARBINARY(MAX) NULL;
    IF COL_LENGTH('Incidents', 'createdByEmail') IS NULL
      ALTER TABLE Incidents ADD createdByEmail NVARCHAR(255) NULL;
    IF COL_LENGTH('Incidents', 'createdByName') IS NULL
      ALTER TABLE Incidents ADD createdByName NVARCHAR(255) NULL;
    IF COL_LENGTH('Incidents', 'approvalStatus') IS NULL
      ALTER TABLE Incidents ADD approvalStatus NVARCHAR(20) NOT NULL CONSTRAINT DF_Incidents_approvalStatus DEFAULT 'Pending';
    IF COL_LENGTH('Incidents', 'verifiedByEmail') IS NULL
      ALTER TABLE Incidents ADD verifiedByEmail NVARCHAR(255) NULL;
    IF COL_LENGTH('Incidents', 'verifiedByName') IS NULL
      ALTER TABLE Incidents ADD verifiedByName NVARCHAR(255) NULL;
    IF COL_LENGTH('Incidents', 'approvedByEmail') IS NULL
      ALTER TABLE Incidents ADD approvedByEmail NVARCHAR(255) NULL;
    IF COL_LENGTH('Incidents', 'approvedByName') IS NULL
      ALTER TABLE Incidents ADD approvedByName NVARCHAR(255) NULL;
    IF COL_LENGTH('Incidents', 'approvedAt') IS NULL
      ALTER TABLE Incidents ADD approvedAt DATETIME2 NULL;
  `);
}

// Map UI-facing strings → numeric values
const LIKELIHOOD_MAP = {
  "Very Low": 1,
  Low: 2,
  Medium: 3,
  High: 4,
  "Very High": 5,
};

const IMPACT_MAP = {
  "Very Low": 1,
  Low: 2,
  Medium: 3,
  High: 4,
  "Very High": 5,
};

// Risk level thresholds by score
const RISK_LEVEL = {
  1: "Low",
  2: "Low",
  3: "Low",
  4: "Low",
  5: "Medium",
  6: "Medium",
  7: "Medium",
  8: "Medium",
  9: "Medium",
  10: "High",
  11: "High",
  12: "High",
  13: "High",
  14: "High",
  15: "High",
  16: "High",
  17: "Critical",
  18: "Critical",
  19: "Critical",
  20: "Critical",
  21: "Critical",
  22: "Critical",
  23: "Critical",
  24: "Critical",
  25: "Critical",
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
  "Network",
  "Hardware",
  "Software",
  "Security",
  "Database",
  "Application",
  "Other",
];

function validateIncident(data) {
  const required = [
    "incidentRefNo",
    "incidentDate",
    "incidentDetails",
    "incidentCategory",
    "likelihood",
    "impact",
    "priority",
    "status",
  ];
  for (const field of required) {
    if (!data[field]) return `${field} is required`;
  }
  if (!allowedLikelihoods.includes(data.likelihood))
    return `Invalid likelihood: ${data.likelihood}`;
  if (!allowedImpacts.includes(data.impact))
    return `Invalid impact: ${data.impact}`;
  if (!STATUSES.includes(data.status)) return `Invalid status: ${data.status}`;
  if (!CATEGORIES.includes(data.incidentCategory))
    return `Invalid category: ${data.incidentCategory}`;
  return null;
}

const getAllIncidents = async (_req, res) => {
  try {
    await ensureIncidentColumns();
    const result = await pool.request().query(
      `SELECT ${INCIDENT_COLUMNS}
         FROM Incidents
         ORDER BY srNo DESC`,
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching incidents:", {
      message: err.message,
      code: err.code,
      state: err.state,
      number: err.number,
    });
    res
      .status(500)
      .json({ error: "Failed to fetch incidents", details: err.message });
  }
};

const getIncidentById = async (req, res) => {
  try {
    await ensureIncidentColumns();
    const result = await pool
      .request()
      .input("id", req.params.id)
      .query(
        `SELECT ${INCIDENT_COLUMNS}
           FROM Incidents
          WHERE id = @id`,
      );
    if (result.recordset.length === 0)
      return res.status(404).json({ error: "Incident not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching incident:", err);
    res.status(500).json({ error: "Failed to fetch incident" });
  }
};

const createIncident = async (req, res) => {
  try {
    await ensureIncidentColumns();
    const valError = validateIncident(req.body);
    if (valError) return res.status(400).json({ error: valError });

    const {
      incidentDate,
      incidentDetails,
      incidentCategory,
      likelihood,
      impact,
      priority,
      rca,
      status,
    } = req.body;
    const { riskScore, riskLevel } = computeRisk(likelihood, impact);

    const maxSrNo = (
      await pool
        .request()
        .query("SELECT ISNULL(MAX(srNo), 0) as maxSrNo FROM Incidents")
    ).recordset[0].maxSrNo;
    const srNo = maxSrNo + 1;
    const incidentRefNo = generateRiskRefNo(srNo);

    const newId = req.body.id || require("crypto").randomUUID();

    await pool
      .request()
      .input("id", newId)
      .input("srNo", srNo)
      .input("incidentRefNo", incidentRefNo)
      .input("incidentDate", incidentDate)
      .input("incidentDetails", incidentDetails)
      .input("incidentCategory", incidentCategory)
      .input("likelihood", likelihood)
      .input("impact", impact)
      .input("riskScore", riskScore)
      .input("riskLevel", riskLevel)
      .input("priority", priority)
      .input("rca", rca || "")
      .input("status", status)
      .input("createdByEmail", req.user?.email || "")
      .input("createdByName", req.user?.fullName || req.user?.email || "")
      .query(
        `INSERT INTO Incidents
           (id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory,
            likelihood, impact, riskScore, riskLevel, priority, rca, status,
            createdByEmail, createdByName, approvalStatus)
         VALUES
           (@id, @srNo, @incidentRefNo, @incidentDate, @incidentDetails, @incidentCategory,
            @likelihood, @impact, @riskScore, @riskLevel, @priority, @rca, @status,
            @createdByEmail, @createdByName, 'Pending')`,
      );

    const newIncident = (
      await pool
        .request()
        .input("id", newId)
        .query(
          `SELECT ${INCIDENT_COLUMNS}
           FROM Incidents
          WHERE id = @id`,
        )
    ).recordset[0];

    res.status(201).json(newIncident);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ error: "Failed to create incident" });
  }
};

const updateIncident = async (req, res) => {
  try {
    await ensureIncidentColumns();
    const existing = (
      await pool
        .request()
        .input("id", req.params.id)
        .query("SELECT approvalStatus FROM Incidents WHERE id = @id")
    ).recordset[0];
    if (!existing) return res.status(404).json({ error: "Incident not found" });
    if (existing.approvalStatus === "Approved") {
      return res.status(409).json({ error: "Approved risks cannot be updated" });
    }

    const valError = validateIncident(req.body);
    if (valError) return res.status(400).json({ error: valError });

    const { id } = req.params;
    const {
      incidentRefNo,
      incidentDate,
      incidentDetails,
      incidentCategory,
      likelihood,
      impact,
      priority,
      rca,
      status,
    } = req.body;
    const { riskScore, riskLevel } = computeRisk(likelihood, impact);

    const result = await pool
      .request()
      .input("id", id)
      .input("incidentRefNo", incidentRefNo)
      .input("incidentDate", incidentDate)
      .input("incidentDetails", incidentDetails)
      .input("incidentCategory", incidentCategory)
      .input("likelihood", likelihood)
      .input("impact", impact)
      .input("riskScore", riskScore)
      .input("riskLevel", riskLevel)
      .input("priority", priority)
      .input("rca", rca || "")
      .input("status", status)
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
          WHERE id = @id`,
      );

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: "Incident not found" });

    const updated = (
      await pool
        .request()
        .input("id", id)
        .query(
          `SELECT ${INCIDENT_COLUMNS}
           FROM Incidents
          WHERE id = @id`,
        )
    ).recordset[0];

    res.json(updated);
  } catch (err) {
    console.error("Error updating incident:", err);
    res.status(500).json({ error: "Failed to update incident" });
  }
};

const deleteIncident = async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("id", req.params.id)
      .query("DELETE FROM Incidents WHERE id = @id");
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: "Incident not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting incident:", err);
    res.status(500).json({ error: "Failed to delete incident" });
  }
};

const uploadSupportingDoc = async (req, res) => {
  try {
    await ensureIncidentColumns();
    const existing = (
      await pool
        .request()
        .input("id", req.params.id)
        .query("SELECT approvalStatus FROM Incidents WHERE id = @id")
    ).recordset[0];
    if (!existing) return res.status(404).json({ error: "Incident not found" });
    if (existing.approvalStatus === "Approved") {
      return res.status(409).json({ error: "Approved risks cannot be updated" });
    }

    const fileBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);
    if (!fileBuffer.length) {
      return res.status(400).json({ error: "Supporting document is required" });
    }

    const fileName = req.query.fileName || req.headers["x-file-name"] || "supporting-document";
    const mimeType = req.query.mimeType || req.headers["content-type"] || "application/octet-stream";

    const request = pool
      .request()
      .input("id", req.params.id)
      .input("docName", String(fileName))
      .input("docMime", String(mimeType))
      .input("docData", sql.VarBinary(sql.MAX), fileBuffer);

    const isAdminUpload = req.user?.role === "admin";
    const result = await request.query(
      isAdminUpload
        ? `UPDATE Incidents
              SET adminSupportingDocName = @docName,
                  adminSupportingDocMime = @docMime,
                  adminSupportingDocData = @docData,
                  updatedAt = GETDATE()
            WHERE id = @id`
        : `UPDATE Incidents
              SET supportingDocName = @docName,
                  supportingDocMime = @docMime,
                  supportingDocData = @docData,
                  updatedAt = GETDATE()
            WHERE id = @id`
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json({
      message: "Supporting document uploaded",
      supportingDocName: String(fileName),
      supportingDocMime: String(mimeType),
      source: isAdminUpload ? "admin" : "user",
    });
  } catch (err) {
    console.error("Error uploading supporting document:", err);
    res.status(500).json({ error: "Failed to upload supporting document" });
  }
};

const viewSupportingDoc = async (req, res) => {
  try {
    await ensureIncidentColumns();
    const isAdminSource = req.query.source === "admin";
    const result = await pool
      .request()
      .input("id", req.params.id)
      .query(
        isAdminSource
          ? `SELECT adminSupportingDocName AS supportingDocName,
                    adminSupportingDocMime AS supportingDocMime,
                    adminSupportingDocData AS supportingDocData
               FROM Incidents
              WHERE id = @id`
          : `SELECT supportingDocName, supportingDocMime, supportingDocData
               FROM Incidents
              WHERE id = @id`
      );

    const doc = result.recordset[0];
    if (!doc || !doc.supportingDocData) {
      return res.status(404).json({ error: "Supporting document not found" });
    }

    res.setHeader("Content-Type", doc.supportingDocMime || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${doc.supportingDocName || "supporting-document"}"`);
    res.send(doc.supportingDocData);
  } catch (err) {
    console.error("Error viewing supporting document:", err);
    res.status(500).json({ error: "Failed to view supporting document" });
  }
};

const approveIncident = async (req, res) => {
  try {
    await ensureIncidentColumns();
    const { verifiedByEmail = "", verifiedByName = "" } = req.body;
    if (!verifiedByName) {
      return res.status(400).json({ error: "Verifier name is required" });
    }

    const existing = (
      await pool
        .request()
        .input("id", req.params.id)
        .query("SELECT createdByEmail, createdByName, approvalStatus FROM Incidents WHERE id = @id")
    ).recordset[0];

    if (!existing) {
      return res.status(404).json({ error: "Incident not found" });
    }
    if (existing.approvalStatus === "Approved") {
      return res.status(409).json({ error: "Risk is already approved" });
    }

    const sameCreatorEmail =
      verifiedByEmail &&
      existing.createdByEmail &&
      String(verifiedByEmail).toLowerCase() === String(existing.createdByEmail).toLowerCase();
    const sameCreatorName =
      existing.createdByName &&
      String(verifiedByName).trim().toLowerCase() === String(existing.createdByName).trim().toLowerCase();

    if (sameCreatorEmail || sameCreatorName) {
      return res.status(400).json({ error: "Verifier cannot be the same user who created the risk" });
    }

    const approvedByEmail = req.user?.email || "";
    const approvedByName = req.user?.fullName || req.user?.email || "";
    const sameApproverEmail =
      verifiedByEmail &&
      approvedByEmail &&
      String(verifiedByEmail).toLowerCase() === String(approvedByEmail).toLowerCase();
    const sameApproverName =
      verifiedByName &&
      approvedByName &&
      String(verifiedByName).trim().toLowerCase() === String(approvedByName).trim().toLowerCase();

    if (sameApproverEmail || sameApproverName) {
      return res.status(400).json({ error: "Verifier cannot be the same user who approves the risk" });
    }

    await pool
      .request()
      .input("id", req.params.id)
      .input("verifiedByEmail", String(verifiedByEmail))
      .input("verifiedByName", String(verifiedByName))
      .input("approvedByEmail", approvedByEmail)
      .input("approvedByName", approvedByName)
      .query(`
        UPDATE Incidents
           SET approvalStatus = 'Approved',
               verifiedByEmail = @verifiedByEmail,
               verifiedByName = @verifiedByName,
               approvedByEmail = @approvedByEmail,
               approvedByName = @approvedByName,
               approvedAt = GETDATE(),
               updatedAt = GETDATE()
         WHERE id = @id
      `);

    const approved = (
      await pool
        .request()
        .input("id", req.params.id)
        .query(`SELECT ${INCIDENT_COLUMNS} FROM Incidents WHERE id = @id`)
    ).recordset[0];

    res.json(approved);
  } catch (err) {
    console.error("Error approving incident:", err);
    res.status(500).json({ error: "Failed to approve incident" });
  }
};

module.exports = {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  uploadSupportingDoc,
  viewSupportingDoc,
  approveIncident,
  computeRisk,
};
