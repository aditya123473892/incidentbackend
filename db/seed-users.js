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

const JWT_SECRET = process.env.JWT_SECRET || "incident-management-secret-key-2026";

async function main() {
  const p = new sql.ConnectionPool(config);
  try {
    await p.connect();
    const usersToSeed = [
      { email: "risk@company.com", password: "risk123", fullName: "Risk Management User", role: "risk" },
      { email: "incident@company.com", password: "incident123", fullName: "Incident Management User", role: "incident" },
      { email: "admin@company.com", password: "admin123", fullName: "System Administrator", role: "admin" },
    ];

    await p.request().query(`
      DELETE FROM Users
      WHERE email IN ('risk@company.com', 'incident@company.com', 'admin@company.com');
    `);

    for (const user of usersToSeed) {
      const encodedPw = jwt.sign({ password: user.password }, JWT_SECRET);

      await p.request()
        .input("email", user.email)
        .input("password", encodedPw)
        .input("fullName", user.fullName)
        .input("role", user.role)
        .query(
          "INSERT INTO Users (email, password, fullName, role) VALUES (@email, @password, @fullName, @role);"
        );
    }

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
