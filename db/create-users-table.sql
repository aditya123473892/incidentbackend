-- Create Users table for authentication
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Users' AND xtype = 'U')
BEGIN
    CREATE TABLE Users (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        email      NVARCHAR(255) NOT NULL UNIQUE,
        password   NVARCHAR(500) NOT NULL,
        fullName   NVARCHAR(255) NOT NULL,
        role       NVARCHAR(20)  NOT NULL DEFAULT 'user',
        createdAt  DATETIME2     DEFAULT GETDATE()
    );
END

-- Seed a default admin using a JWT-encoded password (matches what authController stores)
IF NOT EXISTS (SELECT * FROM Users)
BEGIN
    INSERT INTO Users (email, password, fullName, role)
    VALUES (
        'admin@company.com',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXNzd29yZCI6ImFkbWluMTIzIiwiaWF0IjoxNzc4OTExNDI1fQ.Ts725BjpcmyQwQHcv1cdZAigrfTZxMa02E7J7FJYhG8',
        'System Administrator',
        'admin'
    );
END
