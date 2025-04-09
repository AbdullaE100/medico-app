#!/bin/bash
# Script to push changes to git

# Add all changes
git add .

# Commit changes with message
git commit -m "Fix metadata schema issues and improve profile validation"

# Push to remote repository
git push -u origin main

echo "Git push complete!" 