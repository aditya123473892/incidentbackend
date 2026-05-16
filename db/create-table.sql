-- Create Incidents table for Incident Management System
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Incidents' AND xtype='U')
BEGIN
    CREATE TABLE Incidents (
        id NVARCHAR(36) PRIMARY KEY,
        srNo INT NOT NULL UNIQUE,
        incidentRefNo NVARCHAR(50) NOT NULL,
        incidentDate DATE NOT NULL,
        incidentDetails NVARCHAR(MAX) NOT NULL,
        incidentCategory NVARCHAR(50) NOT NULL,
        priority NVARCHAR(20) NOT NULL,
        rca NVARCHAR(MAX),
        status NVARCHAR(20) NOT NULL DEFAULT 'Open',
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
END

-- Insert sample data if table is empty
IF NOT EXISTS (SELECT * FROM Incidents)
BEGIN
    INSERT INTO Incidents (id, srNo, incidentRefNo, incidentDate, incidentDetails, incidentCategory, priority, rca, status)
    VALUES 
        ('1', 1, 'INC-2026-001', '2026-05-01', 'Database server went down causing production outage for all users.', 'Database', 'Critical', 'Disk space exhausted on primary DB node due to unrotated logs.', 'Resolved'),
        ('2', 2, 'INC-2026-002', '2026-05-05', 'Network latency spike observed in US-East region.', 'Network', 'High', 'Under investigation.', 'In Progress'),
        ('3', 3, 'INC-2026-003', '2026-05-10', 'Authentication service returning 500 errors intermittently.', 'Application', 'High', 'Memory leak in auth microservice identified.', 'Open'),
        ('4', 4, 'INC-2026-004', '2026-05-12', 'Suspicious login attempts detected from multiple IPs.', 'Security', 'Critical', 'Brute force attack detected. IP block applied.', 'Closed'),
        ('5', 5, 'INC-2026-005', '2026-05-14', 'Scheduled backup job failed silently for 3 consecutive nights.', 'Software', 'Medium', '', 'Open');
END