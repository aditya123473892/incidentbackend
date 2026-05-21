IF COL_LENGTH('Incidents', 'supportingDocName') IS NULL
BEGIN
    ALTER TABLE Incidents ADD supportingDocName NVARCHAR(255) NULL;
END

IF COL_LENGTH('Incidents', 'clientName') IS NULL
BEGIN
    ALTER TABLE Incidents ADD clientName NVARCHAR(100) NOT NULL CONSTRAINT DF_Incidents_clientName DEFAULT 'Pristine Group';
END

IF COL_LENGTH('Incidents', 'supportingDocMime') IS NULL
BEGIN
    ALTER TABLE Incidents ADD supportingDocMime NVARCHAR(150) NULL;
END

IF COL_LENGTH('Incidents', 'supportingDocData') IS NULL
BEGIN
    ALTER TABLE Incidents ADD supportingDocData VARBINARY(MAX) NULL;
END

IF COL_LENGTH('Incidents', 'adminSupportingDocName') IS NULL
BEGIN
    ALTER TABLE Incidents ADD adminSupportingDocName NVARCHAR(255) NULL;
END

IF COL_LENGTH('Incidents', 'adminSupportingDocMime') IS NULL
BEGIN
    ALTER TABLE Incidents ADD adminSupportingDocMime NVARCHAR(150) NULL;
END

IF COL_LENGTH('Incidents', 'adminSupportingDocData') IS NULL
BEGIN
    ALTER TABLE Incidents ADD adminSupportingDocData VARBINARY(MAX) NULL;
END

IF COL_LENGTH('Incidents', 'createdByEmail') IS NULL
BEGIN
    ALTER TABLE Incidents ADD createdByEmail NVARCHAR(255) NULL;
END

IF COL_LENGTH('Incidents', 'createdByName') IS NULL
BEGIN
    ALTER TABLE Incidents ADD createdByName NVARCHAR(255) NULL;
END

IF COL_LENGTH('Incidents', 'approvalStatus') IS NULL
BEGIN
    ALTER TABLE Incidents ADD approvalStatus NVARCHAR(20) NOT NULL CONSTRAINT DF_Incidents_approvalStatus DEFAULT 'Pending';
END

IF COL_LENGTH('Incidents', 'verifiedByEmail') IS NULL
BEGIN
    ALTER TABLE Incidents ADD verifiedByEmail NVARCHAR(255) NULL;
END

IF COL_LENGTH('Incidents', 'verifiedByName') IS NULL
BEGIN
    ALTER TABLE Incidents ADD verifiedByName NVARCHAR(255) NULL;
END

IF COL_LENGTH('Incidents', 'approvedByEmail') IS NULL
BEGIN
    ALTER TABLE Incidents ADD approvedByEmail NVARCHAR(255) NULL;
END

IF COL_LENGTH('Incidents', 'approvedByName') IS NULL
BEGIN
    ALTER TABLE Incidents ADD approvedByName NVARCHAR(255) NULL;
END

IF COL_LENGTH('Incidents', 'approvedAt') IS NULL
BEGIN
    ALTER TABLE Incidents ADD approvedAt DATETIME2 NULL;
END
