const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const jwt = require("jsonwebtoken");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true },
  pool: { max: 1, min: 0, idleTimeoutMillis: 30000 },
};

const JWT_SECRET = "incident-management-secret-key-2026";

async function main() {
  const p = new sql.ConnectionPool(config);
  try {
    await p.connect();
    // Purge bad seed row if present
    await p.request().query("DELETE FROM Users WHERE email = 'admin@company.com';");

    const encodedPw = jwt.sign({ password: "admin123" }, JWT_SECRET);

    await p.request()
      .input("email", "admin@company.com")
      .input("password", encodedPw)
      .input("fullName", "System Administrator")
      .input("role", "admin")
      .query(
        "INSERT INTO Users (email, password, fullName, role) VALUES (@email, @password, @fullName, @role);"
      );

    const users = await p.request().query("SELECT id, email, role, fullName FROM Users;");
    console.log("Users in DB:", JSON.stringify(users.recordset, null, 2));
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  } finally {
    await p.close();
  }
}

main();
