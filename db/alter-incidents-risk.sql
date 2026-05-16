-- Migration: add Likelihood, Impact, RiskScore, RiskLevel to Incidents
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'likelihood' AND Object_ID = Object_ID(N'Incidents')
)
BEGIN
    ALTER TABLE Incidents ADD likelihood NVARCHAR(20) NOT NULL DEFAULT 'Low';
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'impact' AND Object_ID = Object_ID(N'Incidents')
)
BEGIN
    ALTER TABLE Incidents ADD impact NVARCHAR(20) NOT NULL DEFAULT 'Low';
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'riskScore' AND Object_ID = Object_ID(N'Incidents')
)
BEGIN
    ALTER TABLE Incidents ADD riskScore INT NOT NULL DEFAULT 1;
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'riskLevel' AND Object_ID = Object_ID(N'Incidents')
)
BEGIN
    ALTER TABLE Incidents ADD riskLevel NVARCHAR(20) NOT NULL DEFAULT 'Low';
END;
