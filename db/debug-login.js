const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const jwt = require("jsonwebtoken");
const authController = require("../controllers/authController");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true },
  pool: { max: 1, min: 0, idleTimeoutMillis: 30000 },
};

(async () => {
  const p = new sql.ConnectionPool(config);
  await p.connect();

  // Simulate what the login controller does step by step
  const SECRET = "incident-management-secret-key-2026";

  const result = await p.request()
    .input("email", "admin@company.com")
    .query("SELECT id, email, password, fullName, role FROM Users WHERE email = @email");

  const user = result.recordset[0];
  console.log("user found:", !!user);
  if (user) {
    console.log("stored pw (first 80):", user.password.substring(0, 80));
    console.log("stored pw length:", user.password.length);
    console.log("is JWT-like:", user.password.startsWith("eyJ"));

    try {
      const decoded = jwt.verify(user.password, SECRET);
      console.log("decoded payload:", JSON.stringify(decoded));
      console.log("password matches:", decoded.password === "admin123");
    } catch (e) {
      console.error("jwt.verify failed:", e.message, e.name);
      if (e.name === "TokenExpiredError") console.error("Token expired!");
    }

    // Now try the same routine as controller
    const controllerResult = await authController.login(
      { body: { email: "admin@company.com", password: "admin123" } },
      { status: () => ({ json: (d) => { console.log("controller response:", JSON.stringify(d)); return { json: () => {} }; } }), json: () => ({}) }
    );
  }

  await p.close();
})();
