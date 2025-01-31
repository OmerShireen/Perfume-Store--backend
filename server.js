const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const mysql = require('mysql2')
// const db = require('./db');
const authenticateToken = require('./authMiddleware');
// const PORT="3000"
dotenv.config();
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

console.log(process.env);

const db = mysql.createConnection({
    host: process.env.host ,
    user: process.env.user ,
    password:  process.env.password,
    database:  process.env.database,
    dbPort: process.env.dbPort,
  });

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    console.log('Connected to the database.');
  });

// Register Route
app.post('/register', async (req, res) => {
  const { username, email ,password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, email , password) VALUES (?, ?, ?)';
    db.query(sql, [username, email ,hashedPassword], (err) => {
      if (err) {
        return res.status(400).json({ message: 'User already exists or an error occurred', error: err.message });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body; // Change to email instead of username

  const sql = 'SELECT * FROM users WHERE email = ?'; // Query based on email
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error', error: err.message });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password); // Compare password
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const payload = { userId: user.id, email: user.email }; // JWT payload includes user ID and email
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }); // Generate token

    res.json({ token, message: 'Login successful!' }); // Include success message
  });
});


// Protected Route
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You have accessed protected data!', user: req.user });
});

//checkauth
app.get('/checkauth', authenticateToken, (req, res) => {
  res.json({ message: 'You have accessed protected data!'});
});

// Another Example of a Protected Route
app.get('/profile', authenticateToken, (req, res) => {
  const sql = 'SELECT id, username FROM users WHERE id = ?';
  db.query(sql, [req.user.userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error', error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
   
    res.json({ profile: results[0] });
  });
});
// Get product
app.get('/products', (req, res) => {
  const sql = 'SELECT * FROM products'; // Fetch all products
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
    res.json(results); // Return the data as JSON
  });
});
// Add Product
app.post('/products', (req, res) => {
  const { title, price, image_url } = req.body;

// Delete Product
app.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM products WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error deleting product', error: err.message });
    res.json({ message: 'Product deleted successfully' });
  });
});
//Put product
app.put('/products/:id', (req, res) => {
  const productId = req.params.id;
  const updatedData = req.body;

  // Example logic for updating the product
  const productIndex = products.findIndex(p => p.id == parseInt(productId));
  if (productIndex === -1) {
    return res.status(404).send({ error: 'Product not found' });
  }

  products[productIndex] = { ...products[productIndex], ...updatedData };
  res.send(products[productIndex]);
});



  // Validate inputs
  if (!title || !price || !image_url) {
    return res.status(400).json({ message: 'All fields (title, price, image_url) are required' });
  }

  // SQL query to insert product
 
    res.status(201).json({ message: 'Product added successfully' });
  });





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



