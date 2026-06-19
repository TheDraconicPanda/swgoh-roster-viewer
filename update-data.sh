#!/bin/bash

# Update character categories data
# Run this script to refresh the categories from swgoh.gg API

echo "Fetching latest character data from swgoh.gg..."

curl -s "https://swgoh.gg/api/characters/" -o characters-data.json

if [ $? -eq 0 ]; then
    SIZE=$(wc -c < characters-data.json)
    if [ $SIZE -gt 1000 ]; then
        echo "✓ Successfully downloaded character data ($SIZE bytes)"
        echo "✓ File saved as characters-data.json"

        # Count characters
        COUNT=$(grep -o '"base_id"' characters-data.json | wc -l)
        echo "✓ Contains data for $COUNT characters"
    else
        echo "✗ Downloaded file seems too small, might be an error"
        exit 1
    fi
else
    echo "✗ Failed to download data"
    exit 1
fi
