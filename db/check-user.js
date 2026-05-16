const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

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
  const res = await p.request().query(
    "SELECT id, email, LEFT(password, 60) AS pwPrefix, role, fullName FROM Users WHERE email = 'admin@company.com';"
  );
  console.log(JSON.stringify(res.recordset, null, 2));
  await p.close();
})();
