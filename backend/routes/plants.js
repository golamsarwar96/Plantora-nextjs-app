const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const PLANTS_FILE = path.join(__dirname, '../data/plants.json');

const readPlants = () => JSON.parse(fs.readFileSync(PLANTS_FILE));
const writePlants = (data) => fs.writeFileSync(PLANTS_FILE, JSON.stringify(data, null, 2));

// Get all plants with filters
router.get('/', (req, res) => {
  let plants = readPlants();
  const { category, search, difficulty, minPrice, maxPrice, sort } = req.query;

  if (category && category !== 'All') {
    plants = plants.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    plants = plants.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.scientificName.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (difficulty) {
    plants = plants.filter(p => p.careDifficulty === difficulty);
  }

  if (minPrice) {
    plants = plants.filter(p => p.price >= parseFloat(minPrice));
  }

  if (maxPrice) {
    plants = plants.filter(p => p.price <= parseFloat(maxPrice));
  }

  // Sorting
  if (sort) {
    switch (sort) {
      case 'price-low':
        plants.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        plants.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        plants.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
  }

  res.json(plants);
});

// Get single plant
router.get('/:id', (req, res) => {
  const plants = readPlants();
  const plant = plants.find(p => p.id === req.params.id);
  if (!plant) return res.status(404).json({ message: 'Plant not found' });
  res.json(plant);
});

// Create plant (Admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const plants = readPlants();
  const newPlant = {
    id: Date.now().toString(),
    ...req.body,
    rating: 0,
    reviewCount: 0
  };
  plants.push(newPlant);
  writePlants(plants);
  res.status(201).json(newPlant);
});

// Update plant (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const plants = readPlants();
  const index = plants.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Plant not found' });
  
  plants[index] = { ...plants[index], ...req.body };
  writePlants(plants);
  res.json(plants[index]);
});

// Delete plant (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  let plants = readPlants();
  plants = plants.filter(p => p.id !== req.params.id);
  writePlants(plants);
  res.json({ message: 'Plant deleted successfully' });
});

module.exports = router;
