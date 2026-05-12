const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const BLOGS_FILE = path.join(__dirname, '../data/blogs.json');

const readBlogs = () => JSON.parse(fs.readFileSync(BLOGS_FILE));
const writeBlogs = (data) => fs.writeFileSync(BLOGS_FILE, JSON.stringify(data, null, 2));

// Get all blogs
router.get('/', (req, res) => {
  const blogs = readBlogs();
  res.json(blogs);
});

// Get single blog by slug
router.get('/:slug', (req, res) => {
  const blogs = readBlogs();
  const blog = blogs.find(b => b.slug === req.params.slug);
  if (!blog) return res.status(404).json({ message: 'Blog post not found' });
  res.json(blog);
});

// Create blog post (Admin)
router.post('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const blogs = readBlogs();
  const newPost = {
    id: Date.now().toString(),
    ...req.body,
    date: new Date().toISOString()
  };
  blogs.push(newPost);
  writeBlogs(blogs);
  res.status(201).json(newPost);
});

// Delete blog post (Admin)
router.delete('/:slug', authenticateToken, authorizeRoles('admin'), (req, res) => {
  let blogs = readBlogs();
  blogs = blogs.filter(b => b.slug !== req.params.slug);
  writeBlogs(blogs);
  res.json({ message: 'Blog post deleted successfully' });
});

module.exports = router;
