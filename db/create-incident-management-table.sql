-- Create IncidentManagement table with Impact/Urgency matrix
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='IncidentManagement' AND xtype='U')
BEGIN
    CREATE TABLE IncidentManagement (
        id NVARCHAR(36) PRIMARY KEY,
        srNo INT NOT NULL UNIQUE,
        incidentRefNo NVARCHAR(50) NOT NULL,
        incidentDate DATE NOT NULL,
        incidentDetails NVARCHAR(MAX) NOT NULL,
        incidentCategory NVARCHAR(50) NOT NULL,
        priority NVARCHAR(20) NOT NULL,
        impact NVARCHAR(20) NOT NULL,
        urgency NVARCHAR(20) NOT NULL,
        responseTarget INT NOT NULL,  -- minutes
        resolutionTarget INT NOT NULL,  -- hours
        rca NVARCHAR(MAX),
        status NVARCHAR(20) NOT NULL DEFAULT 'Open',
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
END

-- Insert sample data if table is empty
IF NOT EXISTS (SELECT * FROM IncidentManagement)
BEGIN
    INSERT INTO IncidentManagement (id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory, priority, impact, urgency, responseTarget, resolutionTarget, rca, status)
    VALUES 
        ('im1', 1, 'IM-2026-001', '2026-05-15', 'Production deployment rollback due to configuration issue.', 'Software', 'High', 'High', 'Medium', 30, 8, 'Configuration file mismatch in prod environment.', 'Resolved'),
        ('im2', 2, 'IM-2026-002', '2026-05-16', 'SSL certificate renewal failed.', 'Security', 'Medium', 'Medium', 'Medium', 120, 24, 'Pending certificate authority response.', 'In Progress');
END