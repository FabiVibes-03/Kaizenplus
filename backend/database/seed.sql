-- SAMPLE DATA SEED
-- Password for all users is: 123456
-- Import this file in phpMyAdmin to populate your database with test data.

-- 1. Create Users
INSERT INTO users (id, name, email, password, is_global_admin, created_at) VALUES 
(1, 'Super Admin', 'admin@kaizen.com', '$2b$10$xzl6eTG.yb1iaL.i3tHhM.FEkjYvSfZF7pzKI8HJBnKRMZ2FfQKa.', TRUE, NOW()),
(2, 'Alice Manager', 'alice@kaizen.com', '$2b$10$xzl6eTG.yb1iaL.i3tHhM.FEkjYvSfZF7pzKI8HJBnKRMZ2FfQKa.', FALSE, NOW()),
(3, 'Bob Leader', 'bob@kaizen.com', '$2b$10$xzl6eTG.yb1iaL.i3tHhM.FEkjYvSfZF7pzKI8HJBnKRMZ2FfQKa.', FALSE, NOW()),
(4, 'Charlie Dev', 'charlie@kaizen.com', '$2b$10$xzl6eTG.yb1iaL.i3tHhM.FEkjYvSfZF7pzKI8HJBnKRMZ2FfQKa.', FALSE, NOW()),
(5, 'David Dev', 'david@kaizen.com', '$2b$10$xzl6eTG.yb1iaL.i3tHhM.FEkjYvSfZF7pzKI8HJBnKRMZ2FfQKa.', FALSE, NOW());

-- 2. Create Company
INSERT INTO companies (id, name, plan, created_at) VALUES 
(1, 'TechCorp Solutions', 'pro', NOW());

-- 3. Assign Roles (User 1 is Admin, 2 is Manager, 3 is Lead, 4 & 5 are Collabs)
INSERT INTO user_company_roles (user_id, company_id, role) VALUES 
(1, 1, 'manager'), -- Admin also manages the company
(2, 1, 'manager'),
(3, 1, 'team_leader'),
(4, 1, 'collaborator'),
(5, 1, 'collaborator');

-- 4. Create Project
INSERT INTO projects (id, company_id, name, description, status, created_at) VALUES 
(1, 1, 'Kaizen+ MVP Launch', 'Development of the optimization platform', 'active', NOW());

-- 5. Create Team
INSERT INTO teams (id, company_id, name, description, created_at) VALUES 
(1, 1, 'Backend Squad', 'Core API Team', NOW());

-- 6. Add Members to Project
INSERT INTO project_members (project_id, user_id, role) VALUES 
(1, 2, 'manager'),
(1, 3, 'lead'),
(1, 4, 'developer'),
(1, 5, 'developer');

-- 7. Create Tasks
-- Planned Tasks (Managed by Lead/Manager)
INSERT INTO tasks (id, project_id, title, description, status, priority, assigned_to, created_by, planned_start, planned_end, progress, is_extra, created_at) VALUES 
(1, 1, 'Setup Database', 'Configure MySQL and Schema', 'Done', 'high', 4, 3, CURDATE() - INTERVAL 5 DAY, CURDATE() - INTERVAL 2 DAY, 100, FALSE, NOW()),
(2, 1, 'API Authentication', 'JWT implementation', 'In Progress', 'high', 4, 3, CURDATE() - INTERVAL 2 DAY, CURDATE() + INTERVAL 1 DAY, 60, FALSE, NOW()),
(3, 1, 'Frontend Dashboard', 'React/Next.js implementation', 'Todo', 'medium', 5, 3, CURDATE(), CURDATE() + INTERVAL 5 DAY, 0, FALSE, NOW());

-- Extra Task (Created by Collaborator)
INSERT INTO tasks (id, project_id, title, description, status, priority, assigned_to, created_by, planned_start, planned_end, progress, is_extra, created_at) VALUES 
(4, 1, 'Fix Login Bug', 'Users reporting 403 on login', 'Done', 'critical', 4, 4, CURDATE(), CURDATE(), 100, TRUE, NOW());

-- 8. Daily Logs (History)
INSERT INTO daily_logs (task_id, user_id, log_date, status_color, progress_logged, activity_type) VALUES 
(2, 4, CURDATE(), 'Green', 60, 'progress');

-- 9. Kudos (Collaboration)
INSERT INTO daily_logs (user_id, related_user_id, log_date, activity_type, comments) VALUES 
(4, 5, CURDATE(), 'HELP_RECEIVED', 'David helped me debug the DB connection');
