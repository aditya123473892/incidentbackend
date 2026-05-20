const { pool } = require("../config/db");
const jwt = require("jsonwebtoken");

const LEGACY_JWT_SECRET = "incident-management-secret-key-2026";
const JWT_SECRET = process.env.JWT_SECRET || LEGACY_JWT_SECRET;
const JWT_EXPIRES_IN = "24h";

const verifyStoredPassword = (storedPassword, password) => {
  const candidateSecrets = Array.from(new Set([JWT_SECRET, LEGACY_JWT_SECRET]));

  for (const secret of candidateSecrets) {
    try {
      const decoded = jwt.verify(storedPassword, secret);
      if (decoded.password === password) {
        return true;
      }
    } catch (err) {
      if (err.name !== "JsonWebTokenError" && err.name !== "TokenExpiredError") {
        throw err;
      }
    }
  }

  return false;
};

const signup = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required" });
    }

    const allowedRoles = ["user", "admin", "risk", "incident"];
    const userRole = allowedRoles.includes(role) ? role : "user";

    const existing = await pool.request()
      .input("email", email)
      .query("SELECT id FROM Users WHERE email = @email");

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const pwHash = jwt.sign({ password }, JWT_SECRET);

    const result = await pool.request()
      .input("email", email)
      .input("password", pwHash)
      .input("fullName", fullName)
      .input("role", userRole)
      .query(`
        INSERT INTO Users (email, password, fullName, role)
        VALUES (@email, @password, @fullName, @role);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const userId = result.recordset[0].id;

    const token = jwt.sign(
      { id: userId, email, role: userRole, fullName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: { id: userId, email, fullName, role: userRole },
    });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.request()
      .input("email", email)
      .query("SELECT id, email, password, fullName, role FROM Users WHERE email = @email");

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!verifyStoredPassword(user.password, password)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    console.error("Error during login:", err);
    res.status(500).json({ error: "Failed to log in" });
  }
};

const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const users = async (_req, res) => {
  try {
    const result = await pool.request().query(
      "SELECT id, email, fullName, role FROM Users ORDER BY fullName, email"
    );
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

module.exports = { signup, login, me, users };
