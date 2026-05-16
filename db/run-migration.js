const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const fs = require("fs");

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

  const script = fs.readFileSync(path.join(__dirname, "alter-incidents-risk.sql"), "utf8");
  await p.request().query(script);
  console.log("Migration applied.");

  const cols = await p.request().query(
    "SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Incidents') ORDER BY column_id"
  );
  console.log("Columns:", cols.recordset.map((c) => c.name).join(", "));

  await p.close();
})();
