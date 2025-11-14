# Deployment Guide - cPanel Hosting

This guide walks you through deploying BehavioralTrack to cPanel hosting.

## Prerequisites

- cPanel hosting account with:
  - Node.js support (v18+)
  - MySQL database access
  - SSH access (recommended)
  - Domain or subdomain configured

## Deployment Overview

1. Set up MySQL database
2. Upload and configure backend
3. Build and upload frontend
4. Configure environment variables
5. Set up Node.js application
6. Configure domain/subdomain
7. Test the application

---

## Step 1: Set up MySQL Database

### Via cPanel MySQL Database Wizard

1. Log into cPanel
2. Navigate to **MySQL Database Wizard**
3. Create database:
   - Database Name: `behavioral_track`
   - Click "Next Step"

4. Create database user:
   - Username: `bt_user`
   - Password: Generate strong password
   - Click "Create User"

5. Add user to database:
   - Select user and database
   - Grant **ALL PRIVILEGES**
   - Click "Next Step"

### Import Database Schema

1. Navigate to **phpMyAdmin** in cPanel
2. Select your database (`behavioral_track`)
3. Click **Import** tab
4. Upload `database/schema.sql`
5. Click **Go**

---

## Step 2: Upload Backend Files

### Option A: Via SSH (Recommended)

```bash
# On your local machine
cd server
tar -czf server.tar.gz src/ package.json package-lock.json

# Upload to server (replace with your details)
scp server.tar.gz username@yourdomain.com:~/

# SSH into server
ssh username@yourdomain.com

# Extract files
mkdir -p ~/behavioral_track/server
tar -xzf server.tar.gz -C ~/behavioral_track/server
cd ~/behavioral_track/server

# Install dependencies
npm install --production
```

### Option B: Via File Manager

1. In cPanel, open **File Manager**
2. Navigate to your home directory
3. Create folder: `behavioral_track/server`
4. Upload these files from your local `server/` directory:
   - All files in `src/` folder
   - `package.json`
   - `package-lock.json`
5. Open **Terminal** in cPanel
6. Run:
   ```bash
   cd ~/behavioral_track/server
   npm install --production
   ```

---

## Step 3: Configure Backend Environment

Create `.env` file in `~/behavioral_track/server/`:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=bt_user
DB_PASSWORD=your_database_password_here
DB_NAME=behavioral_track

# Security
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRE=7d

# CORS (your domain)
CORS_ORIGIN=https://yourdomain.com
```

**Important:**
- Replace `your_database_password_here` with actual password
- Generate secure JWT_SECRET (32+ characters, random)
- Set CORS_ORIGIN to your actual domain

### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Set up Node.js Application in cPanel

1. In cPanel, navigate to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: `behavioral_track/server`
   - **Application URL**: Choose subdomain (e.g., `api.yourdomain.com`)
   - **Application startup file**: `src/server.js`
   - **Application port**: `3000` (must match .env)

4. Click **Create**
5. Note the command to enter virtual environment
6. Click **Run NPM Install** if available

### Start the Application

In cPanel Terminal:
```bash
cd ~/behavioral_track/server
# Enter virtual environment (use command shown in Node.js App interface)
source /home/username/nodevenv/behavioral_track/server/18/bin/activate

# Start application
npm start
```

### Set up Process Manager (Keep App Running)

Create `ecosystem.config.js` in server directory:

```javascript
module.exports = {
  apps: [{
    name: 'behavioral-track-api',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Install and configure PM2:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Step 5: Build and Upload Frontend

### On Your Local Machine

```bash
cd client

# Update API endpoint in .env.production
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env.production

# Build for production
npm run build
```

This creates a `dist/` folder with optimized files.

### Upload to cPanel

#### Option A: Via SSH
```bash
# Create tarball
cd dist
tar -czf dist.tar.gz *

# Upload
scp dist.tar.gz username@yourdomain.com:~/

# SSH and extract
ssh username@yourdomain.com
cd ~/public_html
tar -xzf ~/dist.tar.gz
```

#### Option B: Via File Manager
1. In cPanel File Manager, navigate to `public_html/`
2. Upload all files from local `client/dist/` folder
3. Ensure `index.html` is in the root of `public_html/`

---

## Step 6: Configure Domain/Subdomain

### Main Domain Setup

If deploying to main domain (yourdomain.com):
- Frontend files are already in `public_html/`
- Configure API subdomain (next section)

### API Subdomain Setup

1. In cPanel, go to **Subdomains**
2. Create subdomain: `api.yourdomain.com`
3. Document root: (cPanel will auto-create)

4. Create `.htaccess` in subdomain root:
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

This proxies requests to your Node.js app.

### Alternative: Single Domain with /api Path

Edit `public_html/.htaccess`:
```apache
# Proxy API requests to Node.js
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Serve React app for all other requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

Update client `.env.production`:
```env
VITE_API_URL=/api
```

---

## Step 7: SSL Certificate (HTTPS)

### Via cPanel SSL/TLS

1. Navigate to **SSL/TLS Status**
2. Select your domain(s)
3. Click **Run AutoSSL**
4. Wait for certificate installation

### Force HTTPS

Add to `public_html/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Step 8: Testing

### Test Backend API

```bash
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{"success": true, "message": "API is running"}
```

### Test Frontend

Visit: `https://yourdomain.com`

You should see the BehavioralTrack login page.

### Test Database Connection

```bash
# SSH into server
ssh username@yourdomain.com

# Test MySQL connection
mysql -u bt_user -p behavioral_track

# Run query
SELECT COUNT(*) FROM users;
```

---

## Troubleshooting

### Issue: Node.js app won't start

**Check logs:**
```bash
cd ~/behavioral_track/server
cat logs/error.log
```

**Common causes:**
- Port already in use
- Database credentials incorrect
- Missing dependencies

**Solution:**
```bash
# Verify .env file
cat .env

# Test database connection
mysql -u bt_user -p behavioral_track

# Reinstall dependencies
rm -rf node_modules
npm install --production
```

### Issue: "Cannot connect to API"

**Check:**
1. Node.js app is running: `pm2 status`
2. `.htaccess` proxy is correct
3. CORS settings in backend allow your domain
4. Firewall allows port 3000

**Test API directly:**
```bash
curl http://localhost:3000/api/health
```

### Issue: Database connection errors

**Check:**
- Database exists: `mysql -u bt_user -p behavioral_track`
- User has permissions: `SHOW GRANTS FOR 'bt_user'@'localhost';`
- Host is 'localhost' (not IP address)

### Issue: 404 errors on React routes

Frontend router not configured properly.

**Fix `.htaccess` in `public_html/`:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Issue: Slow performance

**Optimize:**
1. Enable gzip compression in `.htaccess`:
   ```apache
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
   </IfModule>
   ```

2. Enable browser caching:
   ```apache
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpg "access plus 1 year"
     ExpiresByType image/jpeg "access plus 1 year"
     ExpiresByType image/gif "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
   </IfModule>
   ```

3. Database indexes (already in schema.sql)

---

## Maintenance

### Viewing Logs

```bash
# Application logs
pm2 logs behavioral-track-api

# Apache error log
tail -f ~/logs/error_log

# MySQL slow query log
cat /var/log/mysql-slow.log
```

### Updating the Application

**Backend:**
```bash
cd ~/behavioral_track/server
git pull  # if using git
npm install --production
pm2 restart behavioral-track-api
```

**Frontend:**
```bash
# On local machine
cd client
npm run build

# Upload new dist/ files to server
scp -r dist/* username@yourdomain.com:~/public_html/
```

### Database Backup

**Manual:**
```bash
mysqldump -u bt_user -p behavioral_track > backup_$(date +%Y%m%d).sql
```

**Automated (cron job):**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * mysqldump -u bt_user -p'password' behavioral_track > ~/backups/bt_$(date +\%Y\%m\%d).sql
```

### Monitoring

Set up monitoring for:
- Application uptime (PM2 dashboard)
- Disk space usage
- Database size
- SSL certificate expiration
- Error rates in logs

---

## Security Checklist

- [ ] Strong database password
- [ ] Secure JWT secret (32+ chars)
- [ ] HTTPS enabled with valid SSL
- [ ] CORS configured for your domain only
- [ ] File permissions correct (644 for files, 755 for directories)
- [ ] `.env` file not publicly accessible
- [ ] Regular database backups configured
- [ ] Application logs monitored
- [ ] Dependencies updated regularly
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection (React default + CSP headers)

---

## Performance Benchmarks

Expected performance on shared cPanel hosting:
- API response time: < 200ms (simple queries)
- Page load time: < 2 seconds (on 4G)
- Concurrent users: 50-100
- Database queries: < 50ms (with indexes)

For higher traffic, consider:
- VPS or dedicated server
- Database optimization
- CDN for static assets
- Redis caching layer

---

## Support Resources

- cPanel Documentation: https://docs.cpanel.net/
- Node.js on cPanel: https://docs.cpanel.net/ea4/nodejs/
- MySQL Documentation: https://dev.mysql.com/doc/
- PM2 Process Manager: https://pm2.keymetrics.io/

## Next Steps

After successful deployment:
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure automated backups
4. Document any hosting-specific configurations
5. Create user accounts for testing
6. Train end users on the application
