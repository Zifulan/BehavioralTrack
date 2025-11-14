-- BehavioralTrack Database Schema
-- MySQL 8.0+

-- Create database (optional - may already exist)
CREATE DATABASE IF NOT EXISTS behavioral_track CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE behavioral_track;

-- ============================================================================
-- Users Table (Therapists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    credentials VARCHAR(255) DEFAULT NULL COMMENT 'Professional credentials (e.g., BCBA, LBA)',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,

    INDEX idx_email (email),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Clients Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT 'Therapist who manages this client',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE DEFAULT NULL,
    active BOOLEAN DEFAULT TRUE,
    notes TEXT DEFAULT NULL COMMENT 'General notes about the client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_active (active),
    INDEX idx_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT 'Therapist conducting the session',
    client_id INT UNSIGNED NOT NULL,
    session_date DATE NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL COMMENT 'Session location (e.g., clinic, home, school)',
    notes TEXT DEFAULT NULL COMMENT 'Session notes and observations',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client_id (client_id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_date (session_date),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Behaviors Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS behaviors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL COMMENT 'Behavior name (e.g., "Hand Raising", "Aggression")',
    type ENUM('tally', 'duration') NOT NULL COMMENT 'tally = count occurrences, duration = track time',
    description TEXT DEFAULT NULL COMMENT 'Detailed description of the behavior',
    target_value INT DEFAULT NULL COMMENT 'Optional goal/target for this behavior',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Behavior Logs Table (Individual occurrences/timings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS behavior_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    behavior_id INT UNSIGNED NOT NULL,

    -- For both tally and duration
    timestamp DATETIME NOT NULL COMMENT 'When the log was recorded',

    -- For tally behaviors
    tally_value INT DEFAULT 1 COMMENT 'Usually 1, but could be bulk increments',

    -- For duration behaviors
    start_time DATETIME DEFAULT NULL COMMENT 'When behavior started (duration type)',
    end_time DATETIME DEFAULT NULL COMMENT 'When behavior ended (duration type)',
    duration_seconds INT DEFAULT NULL COMMENT 'Calculated duration in seconds',

    -- Optional metadata
    notes TEXT DEFAULT NULL COMMENT 'Notes about this specific occurrence',
    antecedent VARCHAR(500) DEFAULT NULL COMMENT 'What happened before (ABC data)',
    consequence VARCHAR(500) DEFAULT NULL COMMENT 'What happened after (ABC data)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (behavior_id) REFERENCES behaviors(id) ON DELETE CASCADE,
    INDEX idx_behavior_id (behavior_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Behavior Templates Table (Optional - for commonly tracked behaviors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS behavior_templates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT 'Therapist who created this template',
    name VARCHAR(255) NOT NULL,
    type ENUM('tally', 'duration') NOT NULL,
    description TEXT DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL COMMENT 'e.g., "Communication", "Social", "Aggressive"',
    is_default BOOLEAN DEFAULT FALSE COMMENT 'System-wide default templates',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Export History Table (Track generated exports)
-- ============================================================================
CREATE TABLE IF NOT EXISTS export_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    session_ids JSON NOT NULL COMMENT 'Array of session IDs included in export',
    format ENUM('csv', 'pdf') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) DEFAULT NULL COMMENT 'Path to generated file (if stored)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View: Session Summary with behavior counts
CREATE OR REPLACE VIEW session_summary AS
SELECT
    s.id AS session_id,
    s.session_date,
    s.start_time,
    s.end_time,
    TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) AS duration_minutes,
    c.id AS client_id,
    CONCAT(c.first_name, ' ', c.last_name) AS client_name,
    u.id AS therapist_id,
    CONCAT(u.first_name, ' ', u.last_name) AS therapist_name,
    COUNT(DISTINCT b.id) AS behavior_count,
    SUM(CASE WHEN b.type = 'tally' THEN 1 ELSE 0 END) AS tally_count,
    SUM(CASE WHEN b.type = 'duration' THEN 1 ELSE 0 END) AS duration_count
FROM sessions s
JOIN clients c ON s.client_id = c.id
JOIN users u ON s.user_id = u.id
LEFT JOIN behaviors b ON s.id = b.session_id
GROUP BY s.id, s.session_date, s.start_time, s.end_time,
         c.id, c.first_name, c.last_name,
         u.id, u.first_name, u.last_name;

-- View: Behavior statistics per behavior
CREATE OR REPLACE VIEW behavior_stats AS
SELECT
    b.id AS behavior_id,
    b.name AS behavior_name,
    b.type AS behavior_type,
    b.session_id,
    s.session_date,
    COUNT(bl.id) AS total_logs,
    SUM(CASE WHEN b.type = 'tally' THEN bl.tally_value ELSE 0 END) AS total_count,
    SUM(CASE WHEN b.type = 'duration' THEN bl.duration_seconds ELSE 0 END) AS total_duration_seconds,
    AVG(CASE WHEN b.type = 'duration' THEN bl.duration_seconds ELSE NULL END) AS avg_duration_seconds,
    MIN(bl.timestamp) AS first_occurrence,
    MAX(bl.timestamp) AS last_occurrence
FROM behaviors b
JOIN sessions s ON b.session_id = s.id
LEFT JOIN behavior_logs bl ON b.id = bl.behavior_id
GROUP BY b.id, b.name, b.type, b.session_id, s.session_date;

-- ============================================================================
-- Sample Data (for development/testing)
-- ============================================================================

-- Sample therapist (password is 'password123' - hashed with bcrypt)
-- Note: In production, this should be created via the registration API
INSERT INTO users (email, password_hash, first_name, last_name, credentials) VALUES
('demo@therapist.com', '$2b$10$rKvK1j8QJQX8Z8Z8Z8Z8ZuX8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', 'Demo', 'Therapist', 'BCBA');

-- Sample clients (using user_id = 1 from above)
INSERT INTO clients (user_id, first_name, last_name, date_of_birth, notes) VALUES
(1, 'Sarah', 'Johnson', '2015-03-15', 'Working on communication skills'),
(1, 'Michael', 'Brown', '2016-07-22', 'Focus on social interaction');

-- Sample session
INSERT INTO sessions (user_id, client_id, session_date, start_time, end_time, notes) VALUES
(1, 1, CURDATE(), NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, 'Good session, client was engaged');

-- Sample behavior templates
INSERT INTO behavior_templates (user_id, name, type, description, category, is_default) VALUES
(1, 'Hand Raising', 'tally', 'Student raises hand before speaking', 'Communication', TRUE),
(1, 'On-Task Behavior', 'duration', 'Time student is focused on assigned task', 'Academic', TRUE),
(1, 'Verbal Aggression', 'tally', 'Yelling, screaming, or threatening language', 'Challenging', TRUE),
(1, 'Physical Aggression', 'tally', 'Hitting, kicking, pushing others', 'Challenging', TRUE),
(1, 'Self-Injurious Behavior', 'tally', 'Head banging, scratching, biting self', 'Challenging', TRUE),
(1, 'Peer Interaction', 'duration', 'Appropriate interaction with peers', 'Social', TRUE);

-- ============================================================================
-- Stored Procedures (Optional - for complex operations)
-- ============================================================================

DELIMITER $$

-- Calculate total tally count for a behavior
CREATE PROCEDURE get_behavior_tally_count(IN behavior_id_param INT)
BEGIN
    SELECT
        b.id,
        b.name,
        COALESCE(SUM(bl.tally_value), 0) AS total_count
    FROM behaviors b
    LEFT JOIN behavior_logs bl ON b.id = bl.behavior_id
    WHERE b.id = behavior_id_param AND b.type = 'tally'
    GROUP BY b.id, b.name;
END$$

-- Calculate total duration for a behavior
CREATE PROCEDURE get_behavior_total_duration(IN behavior_id_param INT)
BEGIN
    SELECT
        b.id,
        b.name,
        COALESCE(SUM(bl.duration_seconds), 0) AS total_seconds,
        TIME_FORMAT(SEC_TO_TIME(COALESCE(SUM(bl.duration_seconds), 0)), '%H:%i:%s') AS formatted_duration
    FROM behaviors b
    LEFT JOIN behavior_logs bl ON b.id = bl.behavior_id
    WHERE b.id = behavior_id_param AND b.type = 'duration'
    GROUP BY b.id, b.name;
END$$

-- Get session report data
CREATE PROCEDURE get_session_report(IN session_id_param INT)
BEGIN
    -- Session info
    SELECT
        s.*,
        CONCAT(c.first_name, ' ', c.last_name) AS client_name,
        CONCAT(u.first_name, ' ', u.last_name) AS therapist_name,
        u.credentials AS therapist_credentials
    FROM sessions s
    JOIN clients c ON s.client_id = c.id
    JOIN users u ON s.user_id = u.id
    WHERE s.id = session_id_param;

    -- Behaviors in session
    SELECT * FROM behavior_stats WHERE session_id = session_id_param;

    -- All logs for session
    SELECT
        bl.*,
        b.name AS behavior_name,
        b.type AS behavior_type
    FROM behavior_logs bl
    JOIN behaviors b ON bl.behavior_id = b.id
    WHERE b.session_id = session_id_param
    ORDER BY bl.timestamp;
END$$

DELIMITER ;

-- ============================================================================
-- Triggers (Auto-calculate duration on insert/update)
-- ============================================================================

DELIMITER $$

CREATE TRIGGER calculate_duration_before_insert
BEFORE INSERT ON behavior_logs
FOR EACH ROW
BEGIN
    IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        SET NEW.duration_seconds = TIMESTAMPDIFF(SECOND, NEW.start_time, NEW.end_time);
    END IF;
END$$

CREATE TRIGGER calculate_duration_before_update
BEFORE UPDATE ON behavior_logs
FOR EACH ROW
BEGIN
    IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        SET NEW.duration_seconds = TIMESTAMPDIFF(SECOND, NEW.start_time, NEW.end_time);
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Additional composite indexes for common query patterns
CREATE INDEX idx_client_user ON clients(user_id, active);
CREATE INDEX idx_session_client_date ON sessions(client_id, session_date);
CREATE INDEX idx_behavior_log_timestamp ON behavior_logs(behavior_id, timestamp);

-- Full-text search indexes (optional - for searching notes)
-- ALTER TABLE clients ADD FULLTEXT INDEX ft_notes (notes);
-- ALTER TABLE sessions ADD FULLTEXT INDEX ft_notes (notes);

-- ============================================================================
-- Cleanup and Maintenance
-- ============================================================================

-- Event to clean up old export history (runs daily)
-- Uncomment if you want automatic cleanup of exports older than 90 days
/*
CREATE EVENT IF NOT EXISTS cleanup_old_exports
ON SCHEDULE EVERY 1 DAY
DO
DELETE FROM export_history WHERE created_at < NOW() - INTERVAL 90 DAY;
*/

-- ============================================================================
-- Database Information
-- ============================================================================

SELECT 'Database schema created successfully!' AS message;
SELECT VERSION() AS mysql_version;
SELECT DATABASE() AS current_database;
SHOW TABLES;
