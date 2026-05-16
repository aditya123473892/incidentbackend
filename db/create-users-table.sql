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

-- Seed default module users using JWT-encoded passwords (matches what authController stores)
IF NOT EXISTS (SELECT * FROM Users)
BEGIN
    INSERT INTO Users (email, password, fullName, role)
    VALUES
        (
            'risk@company.com',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXNzd29yZCI6InJpc2sxMjMiLCJpYXQiOjE3Nzg5MjQzOTF9.MXbGnWMItqp1k1lu5HCEBOUipe3DmqKl9r8mHlwT5MM',
            'Risk Management User',
            'risk'
        ),
        (
            'incident@company.com',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXNzd29yZCI6ImluY2lkZW50MTIzIiwiaWF0IjoxNzc4OTI0MzkxfQ.mHTl4dww29SksSr5rabNX2wIS6yyUxllRJxXdBwQwrg',
            'Incident Management User',
            'incident'
        ),
        (
            'admin@company.com',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXNzd29yZCI6ImFkbWluMTIzIiwiaWF0IjoxNzc4OTI0MzkxfQ.owZ2Zp7FTiAV4TX3nq6XAMb-VX_PXCvd1BC-BDMGMFU',
            'System Administrator',
            'admin'
        );
END
