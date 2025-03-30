@echo off
echo Creating users...
echo.

echo Creating Admin User...
node create-admin.js
echo.

echo Creating Trainer User...
node create-trainer.js
echo.

echo Creating Accounts User...
node create-accounts.js
echo.

echo All users created successfully!
echo.
echo You can now log in with:
echo Admin: admin@example.com / admin123
echo Trainer: trainer@example.com / trainer123
echo Accounts: accounts@example.com / accounts123
echo.
pause 