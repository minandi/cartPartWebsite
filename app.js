// app.js - Express server for Car Parts Inventory System
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Import the database module
const fetch = require('node-fetch'); // For making HTTP requests

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
db.initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch(err => {
    console.error('Error initializing database:', err);
  });

// Routes

// Dashboard statistics
app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Get all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await db.getAllVehicles();
    res.json(vehicles);
  } catch (err) {
    console.error('Error getting vehicles:', err);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
});

// Get a specific vehicle with its parts
app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await db.getVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (err) {
    console.error('Error getting vehicle:', err);
    res.status(500).json({ error: 'Failed to get vehicle' });
  }
});

// Add a new vehicle
app.post('/api/vehicles', async (req, res) => {
  try {
    const requiredFields = ['year', 'make', 'model', 'vin', 'purchaseDate', 'purchasePrice', 'damageLocation'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    
    const result = await db.addVehicle(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error adding vehicle:', err);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

// Search for parts
app.get('/api/parts/search', async (req, res) => {
  try {
    const result = await db.searchParts(req.query);
    res.json(result);
  } catch (err) {
    console.error('Error searching parts:', err);
    res.status(500).json({ error: 'Failed to search parts' });
  }
});

// Mark a part as sold
app.post('/api/parts/:id/sell', async (req, res) => {
  try {
    const result = await db.sellPart(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error selling part:', err);
    res.status(500).json({ error: err.message || 'Failed to sell part' });
  }
});

// VIN Lookup using NHTSA API
app.get('/api/vin/:vin', async (req, res) => {
  const vin = req.params.vin;
  
  try {
    // First check if we have this VIN in our database
    const vehicle = await db.getVehicleByVin(vin);
    
    if (vehicle) {
      // If found in our database, return that data
      return res.json({
        vin: vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        success: true,
        source: 'database'
      });
    }
    
    // If not in database, call the NHTSA API
    const apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we got valid results
    if (data.Results && data.Results.length > 0) {
      const vinData = data.Results[0];
      
      // Check if there was an error decoding the VIN
      if (vinData.ErrorCode && vinData.ErrorCode !== "0") {
        throw new Error(`VIN decode error: ${vinData.ErrorText || 'Unknown error'}`);
      }
      
      // Return formatted response
      res.json({
        vin: vin,
        year: vinData.ModelYear,
        make: vinData.Make,
        model: vinData.Model,
        engine: `${vinData.EngineConfiguration || ''} ${vinData.DisplacementL || ''} L`.trim(),
        transmission: vinData.TransmissionStyle,
        bodyType: vinData.BodyClass,
        success: true,
        source: 'nhtsa'
      });
    } else {
      throw new Error('No results returned from VIN decoder');
    }
    
  } catch (err) {
    console.error('Error looking up VIN:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to lookup VIN', 
      success: false 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await db.closeDatabase();
  console.log('Database connection closed');
  process.exit(0);
});