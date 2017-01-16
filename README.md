# data_logger_grapher

Compares two temperature data logger data sets use for refrigeration and print graphs and data associated with cooling periods etc.

# Running
    npm start

# Supported files
  * Excel spreadsheets
  * CSV files

# Supported formats
First row must be headers.

Required headers:

 * Temperature (any name containing 'temp' or 'celsius' case-insensitive is supported)
 * Time (any name containing 'time' or 'date' case-insensitive is supported)

Optional headers:

  * Humidity (any name containing 'hum' case-insensitive is supported)
  * Dew Point (any name containing 'dew' case-insensitive is supported)

# Coding standards
  Adheres to standard js

  run validation with

    npm run validate

# Tests
    npm run test

# Release (win64 only)
    npm run dist
