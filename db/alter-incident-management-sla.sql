-- Migration: add impact/urgency/SLA fields to IncidentManagement
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'impact' AND Object_ID = Object_ID(N'IncidentManagement')
)
BEGIN
    ALTER TABLE IncidentManagement ADD impact NVARCHAR(20) NOT NULL DEFAULT 'Medium';
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'urgency' AND Object_ID = Object_ID(N'IncidentManagement')
)
BEGIN
    ALTER TABLE IncidentManagement ADD urgency NVARCHAR(20) NOT NULL DEFAULT 'Medium';
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'responseTarget' AND Object_ID = Object_ID(N'IncidentManagement')
)
BEGIN
    ALTER TABLE IncidentManagement ADD responseTarget INT NOT NULL DEFAULT 120;
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'resolutionTarget' AND Object_ID = Object_ID(N'IncidentManagement')
)
BEGIN
    ALTER TABLE IncidentManagement ADD resolutionTarget INT NOT NULL DEFAULT 24;
END;
