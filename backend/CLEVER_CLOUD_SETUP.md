# 🚀 Migrating to Clever Cloud MySQL Database

## 📋 Prerequisites
- Node.js installed
- Your Clever Cloud MySQL credentials ready
- Local database with existing data (if migrating)

## 🔧 Step 1: Create Environment File

1. Copy the `env.template` file to `.env`:
   ```bash
   cp env.template .env
   ```

2. The `.env` file should contain your Clever Cloud credentials:
   ```
   MYSQL_ADDON_HOST=begr5npk9smo955afrh3-mysql.services.clever-cloud.com
   MYSQL_ADDON_DB=begr5npk9smo955afrh3
   MYSQL_ADDON_USER=u4ipbi08elhoxmsz
   MYSQL_ADDON_PORT=3306
   MYSQL_ADDON_PASSWORD=zC08nyi3MEVOfI3EisgE
   ```

## 🧪 Step 2: Test Connection

Test your Clever Cloud connection:
```bash
node scripts/testCleverCloudConnection.js
```

This will verify that your credentials are correct and the database is accessible.

## 🗄️ Step 3: Setup Database Structure

If you're starting fresh, create the database structure:
```bash
node scripts/setupDatabase.js
```

## 📦 Step 4: Migrate Existing Data (Optional)

If you have existing data in your localhost database that you want to migrate:
```bash
node scripts/migrateToCleverCloud.js
```

**⚠️ Warning**: This will overwrite any existing data in your Clever Cloud database.

## 🚀 Step 5: Start Your Application

Your application is already configured to use the Clever Cloud database. Just start it:
```bash
npm start
# or
node server.js
```

## 🔍 Verification

Check that your application is using the Clever Cloud database by:
1. Looking at the console logs when starting the server
2. Checking that data is being read/written to the remote database
3. Verifying in your Clever Cloud dashboard that connections are being made

## 🆘 Troubleshooting

### Connection Issues
- Verify your credentials in the `.env` file
- Check if your Clever Cloud MySQL service is running
- Ensure your IP is whitelisted (if required)

### SSL Issues
- The configuration already includes `rejectUnauthorized: false` for SSL
- If you still have issues, check Clever Cloud's SSL requirements

### Performance Issues
- Connection limit is set to 3 (within Clever Cloud's 5 connection limit)
- Consider implementing connection pooling if needed

## 📚 Additional Resources

- [Clever Cloud MySQL Documentation](https://www.clever-cloud.com/en/docs/databases/mysql/)
- [MySQL2 Node.js Driver](https://github.com/sidorares/node-mysql2)

## 🎯 Next Steps

After successful migration:
1. Update your production environment variables in Clever Cloud dashboard
2. Test all functionality thoroughly
3. Monitor database performance and connections
4. Consider implementing database backups
