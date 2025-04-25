// db.js - Database module for Car Parts Inventory System
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'database', 'car_parts_inventory.db');

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath);

// Initialize database with schema
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    
    fs.readFile(schemaPath, 'utf8', (err, schemaSql) => {
      if (err) {
        console.error('Error reading schema file:', err);
        reject(err);
        return;
      }
      
      // Execute the schema SQL
      db.exec(schemaSql, (err) => {
        if (err) {
          console.error('Error initializing database:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
}

// Function to determine if a part is in a damaged area
function isPartInDamagedArea(partLocation, damageLocation) {
  // Map of damage locations to affected part locations
  const damageMap = {
    'Front Left': ['Front Left', 'Front', 'Left'],
    'Front Right': ['Front Right', 'Front', 'Right'],
    'Front Center': ['Front', 'Front Center'],
    'Rear Left': ['Rear Left', 'Rear', 'Left'],
    'Rear Right': ['Rear Right', 'Rear', 'Right'],
    'Rear Center': ['Rear', 'Rear Center'],
    'Left Side': ['Left', 'Front Left', 'Rear Left'],
    'Right Side': ['Right', 'Front Right', 'Rear Right'],
    'Roof': ['Roof', 'Top'],
    'Undercarriage': ['Bottom', 'Undercarriage'],
    'Multiple': [] // Special handling required for multiple damage areas
  };
  
  // If damage location is 'Multiple', would need more specific details
  if (damageLocation === 'Multiple') {
    return false; // Default to false without specific details
  }
  
  // Check if the part location is in the affected areas for the damage location
  return damageMap[damageLocation]?.includes(partLocation) || false;
}

// Function to get standard parts list based on vehicle make/model/year
function getStandardParts(year, make, model) {
  return new Promise((resolve, reject) => {
    // Get all categories to map IDs
    db.all('SELECT * FROM categories', [], (err, categories) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Map category names to IDs
      const categoryMap = {};
      categories.forEach(category => {
        categoryMap[category.name] = category.id;
      });
      
      // Define a comprehensive list of parts by category
      const allParts = [
        // Body Parts
        { category: 'Body Parts', name: 'Front Bumper', location: 'Front', price: 300 },
        { category: 'Body Parts', name: 'Rear Bumper', location: 'Rear', price: 280 },
        { category: 'Body Parts', name: 'Front Left Door', location: 'Front Left', price: 350 },
        { category: 'Body Parts', name: 'Front Right Door', location: 'Front Right', price: 350 },
        { category: 'Body Parts', name: 'Rear Left Door', location: 'Rear Left', price: 320 },
        { category: 'Body Parts', name: 'Rear Right Door', location: 'Rear Right', price: 320 },
        { category: 'Body Parts', name: 'Left Fender', location: 'Front Left', price: 200 },
        { category: 'Body Parts', name: 'Right Fender', location: 'Front Right', price: 200 },
        { category: 'Body Parts', name: 'Hood', location: 'Front', price: 400 },
        { category: 'Body Parts', name: 'Trunk Lid', location: 'Rear', price: 350 },
        
        // Lighting & Electrical
        { category: 'Lighting & Electrical', name: 'Left Headlight Assembly', location: 'Front Left', price: 180 },
        { category: 'Lighting & Electrical', name: 'Right Headlight Assembly', location: 'Front Right', price: 180 },
        { category: 'Lighting & Electrical', name: 'Left Taillight Assembly', location: 'Rear Left', price: 150 },
        { category: 'Lighting & Electrical', name: 'Right Taillight Assembly', location: 'Rear Right', price: 150 },
        { category: 'Lighting & Electrical', name: 'Alternator', location: 'Front', price: 120 },
        { category: 'Lighting & Electrical', name: 'Starter', location: 'Front', price: 100 },
        
        // Engine
        { category: 'Engine', name: 'Engine Assembly', location: 'Front', price: 1200 },
        { category: 'Engine', name: 'Radiator', location: 'Front', price: 150 },
        { category: 'Engine', name: 'Cooling Fan', location: 'Front', price: 80 },
        
        // Transmission & Drivetrain
        { category: 'Transmission & Drivetrain', name: 'Transmission Assembly', location: 'Center', price: 800 },
        { category: 'Transmission & Drivetrain', name: 'Axle Shaft Left', location: 'Left', price: 150 },
        { category: 'Transmission & Drivetrain', name: 'Axle Shaft Right', location: 'Right', price: 150 },
        
        // Interior
        { category: 'Interior', name: 'Front Left Seat', location: 'Front Left', price: 250 },
        { category: 'Interior', name: 'Front Right Seat', location: 'Front Right', price: 250 },
        { category: 'Interior', name: 'Rear Seat', location: 'Rear', price: 300 },
        { category: 'Interior', name: 'Dashboard', location: 'Front', price: 400 },
        { category: 'Interior', name: 'Radio/Navigation Unit', location: 'Front Center', price: 350 },
        
        // Suspension & Steering
        { category: 'Suspension & Steering', name: 'Strut/Shock Front Left', location: 'Front Left', price: 120 },
        { category: 'Suspension & Steering', name: 'Strut/Shock Front Right', location: 'Front Right', price: 120 },
        { category: 'Suspension & Steering', name: 'Steering Rack', location: 'Front', price: 250 },
        
        // Brakes
        { category: 'Brakes', name: 'Brake Caliper Front Left', location: 'Front Left', price: 80 },
        { category: 'Brakes', name: 'Brake Caliper Front Right', location: 'Front Right', price: 80 },
        { category: 'Brakes', name: 'Master Cylinder', location: 'Front', price: 90 },
        
        // Exhaust & Emission
        { category: 'Exhaust & Emission', name: 'Catalytic Converter', location: 'Center', price: 300 },
        { category: 'Exhaust & Emission', name: 'Muffler', location: 'Rear', price: 120 },
        { category: 'Exhaust & Emission', name: 'Exhaust Pipe', location: 'Center', price: 90 }
      ];
      
      // Format parts with correct category IDs
      const partsWithCategoryIds = allParts.map(part => {
        return {
          subcategoryId: categoryMap[part.category],
          name: part.name,
          location: part.location,
          recommendedPrice: part.price
        };
      });
      
      resolve(partsWithCategoryIds);
    });
  });
}

// Add a new vehicle to the inventory
function addVehicle(vehicleData) {
  return new Promise((resolve, reject) => {
    // Start a transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Insert the vehicle
      const vehicleQuery = `
        INSERT INTO vehicles (
          year, make, model, vin, purchase_date, purchase_price, 
          damage_location, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(
        vehicleQuery, 
        [
          vehicleData.year,
          vehicleData.make,
          vehicleData.model,
          vehicleData.vin,
          vehicleData.purchaseDate,
          vehicleData.purchasePrice,
          vehicleData.damageLocation,
          'dismantling', // Initial status
          vehicleData.notes || null
        ],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          const vehicleId = this.lastID;
          
          // Get standard parts for this vehicle type
          getStandardParts(vehicleData.year, vehicleData.make, vehicleData.model)
            .then(standardParts => {
              // Prepare for batch insertion
              const partInsertPromises = standardParts.map(part => {
                // Check if part is in damaged area
                const isDamaged = isPartInDamagedArea(part.location, vehicleData.damageLocation);
                
                return new Promise((resolve, reject) => {
                  const partQuery = `
                    INSERT INTO parts (
                      vehicle_id, category_id, name, location, condition, 
                      price, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                  `;
                  
                  db.run(
                    partQuery,
                    [
                      vehicleId,
                      part.subcategoryId,
                      part.name,
                      part.location,
                      'Good', // Default condition
                      part.recommendedPrice,
                      isDamaged ? 'damaged' : 'available'
                    ],
                    function(err) {
                      if (err) {
                        reject(err);
                      } else {
                        resolve();
                      }
                    }
                  );
                });
              });
              
              // Wait for all parts to be inserted
              Promise.all(partInsertPromises)
                .then(() => {
                  // Update vehicle status to active
                  db.run(
                    'UPDATE vehicles SET status = ? WHERE id = ?',
                    ['active', vehicleId],
                    function(err) {
                      if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                      } else {
                        db.run('COMMIT');
                        resolve({ id: vehicleId, success: true });
                      }
                    }
                  );
                })
                .catch(err => {
                  db.run('ROLLBACK');
                  reject(err);
                });
            })
            .catch(err => {
              db.run('ROLLBACK');
              reject(err);
            });
        }
      );
    });
  });
}

// Get all vehicles with available/sold parts counts
function getAllVehicles() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        v.*,
        (SELECT COUNT(*) FROM parts WHERE vehicle_id = v.id AND status = 'available') as available_parts,
        (SELECT COUNT(*) FROM parts WHERE vehicle_id = v.id AND status = 'sold') as sold_parts
      FROM vehicles v
      ORDER BY date_added DESC
    `;
    
    db.all(query, [], (err, vehicles) => {
      if (err) {
        reject(err);
      } else {
        resolve(vehicles);
      }
    });
  });
}

// Get a specific vehicle with all its parts
function getVehicleById(id) {
  return new Promise((resolve, reject) => {
    // Get vehicle details
    db.get('SELECT * FROM vehicles WHERE id = ?', [id], (err, vehicle) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!vehicle) {
        resolve(null); // No vehicle found
        return;
      }
      
      // Get parts for this vehicle
      const partsQuery = `
        SELECT 
          p.*,
          c.name as category
        FROM parts p
        JOIN categories c ON p.category_id = c.id
        WHERE p.vehicle_id = ?
      `;
      
      db.all(partsQuery, [id], (err, parts) => {
        if (err) {
          reject(err);
        } else {
          // Add parts to vehicle object
          vehicle.parts = parts;
          resolve(vehicle);
        }
      });
    });
  });
}

// Search for parts based on criteria
function searchParts(criteria) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT p.*, v.year, v.make, v.model, c.name as category
      FROM parts p
      JOIN vehicles v ON p.vehicle_id = v.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'available'
    `;
    
    const params = [];
    
    // Add search filters
    if (criteria.year) {
      query += ' AND v.year = ?';
      params.push(criteria.year);
    }
    
    if (criteria.make) {
      query += ' AND v.make LIKE ?';
      params.push(`%${criteria.make}%`);
    }
    
    if (criteria.model) {
      query += ' AND v.model LIKE ?';
      params.push(`%${criteria.model}%`);
    }
    
    if (criteria.part) {
      query += ' AND p.name LIKE ?';
      params.push(`%${criteria.part}%`);
    }
    
    // Execute query
    db.all(query, params, (err, parts) => {
      if (err) {
        reject(err);
      } else {
        resolve(parts);
      }
    });
  });
}

// Mark a part as sold
function sellPart(partId, saleData) {
  return new Promise((resolve, reject) => {
    // Start a transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Get part info
      db.get('SELECT * FROM parts WHERE id = ?', [partId], (err, part) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        if (!part) {db.run('ROLLBACK');
          reject(new Error('Part not found'));
          return;
        }
        
        if (part.status !== 'available') {
          db.run('ROLLBACK');
          reject(new Error('Part is not available for sale'));
          return;
        }
        
        const salePrice = saleData.salePrice || part.price;
        
        // Update part status
        db.run(
          'UPDATE parts SET status = ?, date_sold = CURRENT_TIMESTAMP, sale_price = ? WHERE id = ?',
          ['sold', salePrice, partId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            // Record the sale
            db.run(
              'INSERT INTO sales (part_id, sale_price, customer_info, payment_method) VALUES (?, ?, ?, ?)',
              [partId, salePrice, saleData.customerInfo || null, saleData.paymentMethod || null],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }
                
                // Update vehicle total revenue
                db.run(
                  'UPDATE vehicles SET total_revenue = total_revenue + ? WHERE id = ?',
                  [salePrice, part.vehicle_id],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      reject(err);
                      return;
                    }
                    
                    // Check if all parts are sold or damaged
                    db.get(
                      'SELECT COUNT(*) as count FROM parts WHERE vehicle_id = ? AND status = "available"',
                      [part.vehicle_id],
                      (err, row) => {
                        if (err) {
                          db.run('ROLLBACK');
                          reject(err);
                          return;
                        }
                        
                        if (row.count === 0) {
                          // All parts sold/damaged, mark vehicle as sold out
                          db.run(
                            'UPDATE vehicles SET status = ? WHERE id = ?',
                            ['sold_out', part.vehicle_id],
                            function(err) {
                              if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                              } else {
                                db.run('COMMIT');
                                resolve({ success: true });
                              }
                            }
                          );
                        } else {
                          // Still have available parts
                          db.run('COMMIT');
                          resolve({ success: true });
                        }
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  });
}

// Get dashboard statistics
function getDashboardStats() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM vehicles) as totalVehicles,
        (SELECT COUNT(*) FROM parts WHERE status = 'available') as availableParts,
        (SELECT COUNT(*) FROM parts WHERE status = 'sold') as soldParts,
        (SELECT SUM(total_revenue) FROM vehicles) as totalRevenue
    `;
    
    db.get(query, [], (err, stats) => {
      if (err) {
        reject(err);
      } else {
        // Make sure we have valid values even if DB is empty
        stats.totalVehicles = stats.totalVehicles || 0;
        stats.availableParts = stats.availableParts || 0;
        stats.soldParts = stats.soldParts || 0;
        stats.totalRevenue = stats.totalRevenue || 0;
        
        resolve(stats);
      }
    });
  });
}

// Get data for VIN lookup
function getVehicleByVin(vin) {
  return new Promise((resolve, reject) => {
    db.get('SELECT year, make, model FROM vehicles WHERE vin = ?', [vin], (err, vehicle) => {
      if (err) {
        reject(err);
      } else {
        resolve(vehicle);
      }
    });
  });
}

// Close database connection
function closeDatabase() {  
  return new Promise((resolve, reject) => {
    db.close(err => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

// Export functions
module.exports = {
  initializeDatabase,
  addVehicle,
  getAllVehicles,
  getVehicleById,
  searchParts,
  sellPart,
  getDashboardStats,
  getVehicleByVin,
  closeDatabase
};
