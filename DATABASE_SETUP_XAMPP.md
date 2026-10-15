# XAMPP MySQL Database Setup for Letter Receipt System

This document explains how to create the database and user for the Letter Receipt System using XAMPP on Windows.

## Prerequisites

- XAMPP installed and MySQL service running
- Default XAMPP MySQL: `root` user with **no password** (unless you changed it)
- MySQL port: **3306** (default)

---

## Option 1: Using phpMyAdmin (GUI)

1. Start XAMPP Control Panel and start **MySQL**
2. Open browser: `http://localhost/phpmyadmin`
3. Click **SQL** tab (top menu) and run the following:

```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS `letter_receipt`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create the application user
CREATE USER IF NOT EXISTS 'letter_app'@'localhost' IDENTIFIED BY 'change-this-db-password';

-- Grant privileges on the database
GRANT ALL PRIVILEGES ON `letter_receipt`.* TO 'letter_app'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
```

4. Verify: Click on `letter_receipt` database → **Privileges** tab → confirm `letter_app` has all privileges.

---

## Option 2: Using MySQL Command Line

1. Open **Command Prompt** (cmd.exe)
2. Navigate to XAMPP MySQL bin folder:
   ```cmd
   cd C:\xampp\mysql\bin
   ```
   *(Adjust path if XAMPP is installed elsewhere)*

3. Connect as root (no password by default):
   ```cmd
   mysql -u root
   ```
   *If you set a root password: `mysql -u root -p`*

4. Run the SQL commands:
   ```sql
   CREATE DATABASE IF NOT EXISTS `letter_receipt`
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;

   CREATE USER IF NOT EXISTS 'letter_app'@'localhost' IDENTIFIED BY 'change-this-db-password';

   GRANT ALL PRIVILEGES ON `letter_receipt`.* TO 'letter_app'@'localhost';

   FLUSH PRIVILEGES;
   ```

5. Exit: `EXIT;`

---

## Option 3: Using a SQL File (for automation)

Create a file `setup-database.sql`:

```sql
-- setup-database.sql
-- Run with: mysql -u root < setup-database.sql

CREATE DATABASE IF NOT EXISTS `letter_receipt`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'letter_app'@'localhost' IDENTIFIED BY 'change-this-db-password';

GRANT ALL PRIVILEGES ON `letter_receipt`.* TO 'letter_app'@'localhost';

FLUSH PRIVILEGES;
```

Then run:
```cmd
C:\xampp\mysql\bin\mysql -u root < setup-database.sql
```

---

## Verify the Connection

Test the connection with the application user:

```cmd
C:\xampp\mysql\bin\mysql -u letter_app -p letter_receipt
```
Enter password: `change-this-db-password`

You should see the MySQL prompt. Run `SHOW TABLES;` (will be empty initially - Flyway creates tables on app startup).

---

## Important Notes

### 1. Password Security
- **Change the default password** `change-this-db-password` in both:
  - The SQL above (when creating the user)
  - Your `.env` file (`DB_PASSWORD`)

### 2. Flyway Migrations
- The application uses **Flyway** for database schema management
- On first startup, Flyway will create all tables automatically
- Migration files are in: `src/main/resources/db/migration/`
- **Do not manually create tables** - let Flyway handle it

### 3. XAMPP MySQL Defaults
| Setting | Default Value |
|---------|---------------|
| Host | localhost |
| Port | 3306 |
| Root user | root |
| Root password | (empty) |
| Socket | (TCP/IP only on Windows) |

### 4. Firewall
- Windows Firewall may block incoming connections to port 3306
- For local-only access (this server only), no firewall rule needed
- If other machines need direct MySQL access (not recommended), add inbound rule for port 3306

### 5. MySQL Configuration (my.ini)
XAMPP's `my.ini` is typically at `C:\xampp\mysql\bin\my.ini` or `C:\xampp\mysql\my.ini`.

Recommended settings for production:
```ini
[mysqld]
# Use utf8mb4 by default
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# Increase max connections if needed
max_connections=151

# InnoDB settings
innodb_buffer_pool_size=256M
innodb_log_file_size=64M
innodb_flush_log_at_trx_commit=1

# Disable strict mode if needed for compatibility
# sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
```
Restart MySQL in XAMPP Control Panel after changes.

---

## Troubleshooting

### "Access denied for user 'letter_app'@'localhost'"
- Verify user exists: `SELECT User, Host FROM mysql.user WHERE User='letter_app';`
- Verify grants: `SHOW GRANTS FOR 'letter_app'@'localhost';`
- Re-run the GRANT statement above

### "Unknown database 'letter_receipt'"
- Database not created. Run the CREATE DATABASE statement.

### "Communications link failure"
- MySQL not running. Start it in XAMPP Control Panel.
- Wrong port. Check `DB_PORT=3306` matches XAMPP MySQL port.

### Flyway migration fails
- Check application logs for specific SQL error
- Ensure MySQL version is 8.0+ (XAMPP 8.x includes MySQL 8.x)
- Verify user has CREATE, ALTER, DROP, INDEX privileges

---

## After Database Setup

1. Copy `.env.windows` to `.env` in the `letterapi` folder
2. Update `DB_PASSWORD` in `.env` to match the password you set above
3. Update `APP_BOOTSTRAP_ADMIN_PASSWORD` to a strong password
4. Build and run the backend:
   ```cmd
   mvn clean package -DskipTests
   java -jar target/letter-receipt-system-1.0.0.jar
   ```
5. Check logs for Flyway migration messages and "Started LetterReceiptApplication"

---

## Resetting the Database (Development Only)

**WARNING: This deletes all data!**

```sql
DROP DATABASE IF EXISTS `letter_receipt`;
CREATE DATABASE `letter_receipt` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Then restart the application - Flyway will re-run all migrations.