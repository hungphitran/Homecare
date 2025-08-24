#!/bin/bash

# Deployment script for Vercel
echo "Starting deployment process..."

# Clear existing node_modules and package-lock.json
echo "Clearing existing dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with legacy peer deps
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Build the project
echo "Building project..."
npm run build

echo "Deployment preparation complete!"
