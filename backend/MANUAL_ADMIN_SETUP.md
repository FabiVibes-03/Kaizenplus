# Admin Setup Instructions (Manual)

Since automatic migration failed due to remote database restrictions, please follow these steps manually in your Hostinger PHPMyAdmin:

## 1. Add Admin Column to Users Table
Execute this SQL query:
```sql
ALTER TABLE users ADD COLUMN is_global_admin BOOLEAN DEFAULT FALSE;
```

## 2. Generate Admin Password Hash
Use an online tool or node script to generate a bcrypt hash for your password.
Example for 'admin123': `$2b$10$YourGeneratedHashHere...`

## 3. Create/Promote Admin User
```sql
-- Option A: Promote existing user (Replace 'your_email@example.com')
UPDATE users SET is_global_admin = TRUE WHERE email = 'your_email@example.com';

-- Option B: Insert new admin
INSERT INTO users (name, email, password, is_global_admin, created_at) 
VALUES ('System Admin', 'admin@kaizen.com', '$2b$10$YourGeneratedHash...', TRUE, NOW());
```
