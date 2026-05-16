const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "incident-management-secret-key-2026";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user?.role || (!roles.includes(req.user.role) && req.user.role !== "admin")) {
    return res.status(403).json({ error: "Access denied for this module" });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin, requireRole };
