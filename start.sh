#!/bin/bash

echo ""
echo "========================================"
echo "    CampusClash - College vs College"
echo "========================================"
echo ""
echo "Starting CampusClash application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi

# Check if MySQL is running
echo "Checking MySQL connection..."
if ! command -v mysql &> /dev/null; then
    echo "WARNING: MySQL might not be running!"
    echo "Please start MySQL service first."
    echo ""
fi

echo ""
echo "Installing dependencies..."
npm run install-all

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    echo ""
    exit 1
fi

echo ""
echo "Setting up database..."
npm run setup-db

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to setup database!"
    echo ""
    exit 1
fi

echo ""
echo "Starting CampusClash..."
echo ""
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

npm run dev
