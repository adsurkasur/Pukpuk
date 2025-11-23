<!-- markdownlint-disable MD013 -->
# Scripts Directory

This directory contains utility scripts for managing the Pukpuk application services.

## Available Scripts

### `start_services.py` (Recommended)

A comprehensive Python script that manages both frontend and backend services with advanced features:

- Automatic dependency checking and installation
- Dynamic port detection
- Network IP detection
- Process monitoring and logging
- Graceful shutdown handling
- Cross-platform compatibility

### `start_services.bat`

Windows batch script for quick startup on Windows systems.

### `start_services.ps1`

PowerShell script with parameter support for advanced configuration on Windows.

### `start_services.sh`

Shell script for Unix-like systems (Linux/Mac).

## Usage

For detailed usage instructions, see the main [README.md](../README.md) in the project root.

## Quick Start

```bash
# Using Python script (recommended)
python scripts/start_services.py

# Using platform-specific scripts
./scripts/start_services.sh    # Linux/Mac
scripts\start_services.bat     # Windows CMD
.\scripts\start_services.ps1   # Windows PowerShell
```
<!-- markdownlint-enable MD013 -->