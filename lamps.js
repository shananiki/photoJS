require ('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');


const app = express();
const imagesDir = path.join(__dirname, 'images');

app.use(express.static('public'));
app.use('/images', express.static(imagesDir));

var DB_HOST = process.env.DB_HOST;
var DB_PASSWORD = process.env.DB_PASSWORD;
var DB_DATABASE = process.env.DB_DATABASE;
var DB_USER = process.env.DB_USER;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE
});

app.get('/description/:id', async (req, res) => {
	try {
		const lampId = req.params.id; // Use lampId instead of imageId for clarity
		const connection = await pool.getConnection();

		// Modify the SQL query to filter by lampID
		const sql = `SELECT description FROM lamps WHERE lampID = ?`;
		const [rows] = await connection.execute(sql, [lampId]); // Add lampId as a parameter

		connection.release();

		if (rows.length === 0) {
		  // Handle case where no lamp found for the ID
		  return res.status(404).send('Lamp not found');
		}

		const description = rows[0].description; // Get description from the first row

		res.json({ description }); // Return description as JSON

	} catch (error) {
		console.error(error);
		res.status(500).send('Error fetching lamp description');
	}
});

app.get('/date/:id', async (req, res) => {
	try {
		const lampId = req.params.id; 
		const connection = await pool.getConnection();

		const sql = `SELECT date FROM lamps WHERE lampID = ?`;
		const [rows] = await connection.execute(sql, [lampId]); 

		connection.release();

		if (rows.length === 0) {
		  return res.status(404).send('Lamp not found');
		}

		const date = rows[0].date; 

		res.json({ date });

	} catch (error) {
		console.error(error);
		res.status(500).send('Error fetching lamp description');
	}
});


app.get('/images/:id', (req, res) => {
  const imageId = req.params.id;
  const imagePath = path.join(imagesDir, `${imageId}.png`);

  // Check for PNG first
  res.sendFile(imagePath, (err) => {
    if (err) {
      // If PNG not found, try JPG
      const jpgPath = path.join(imagesDir, `${imageId}.jpg`);
      res.sendFile(jpgPath, (jpgErr) => {
        if (jpgErr) {
          // Send a 404 (Not Found) error if neither image is found
          return res.status(404).send('Image not found');
        }
      });
    }
  });
});

// Configure Multer for file uploads
const upload = multer({
	dest: 'images/',
	filename: (req, file, cb) => {
	  cb(null, getNextLampID() + '.' + getExtension(file.originalname));
	}
  });

// Get next lampID
async function getNextLampID() {
	const [rows] = await pool.query('SELECT AUTO_INCREMENT AS nextID FROM information_schema.TABLES WHERE TABLE_NAME = "lamps"');
	return rows[0].nextID;
}

function getExtension(filename) {
	return filename.split('.').pop();
}

// Upload route
app.post('/upload', upload.single('image'), async (req, res) => {
	const { description, date } = req.body;
	const image = req.file.filename;
	//const nextID = await getNextLampID();
  
	// Check if all fields are provided
	if (!image || !description || !date) {
	  return res.status(400).send('Please fill out all fields');
	}
  
	// Insert data into database
	try {

		const connection = await pool.getConnection();
		const sql = `INSERT INTO lamps (lampID, image, description, date) VALUES (, ?, ?, ?)`;
		const [rows] = await connection.execute(sql, [nextID, image, description, date]); 
		connection.release();
	  
	  	res.send('Image uploaded successfully!');
	} catch (err) {
	  console.error(err);
	  res.status(500).send('Internal server error');
	}
  });

// Serve upload form
app.get('/upload', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'upload.html'));
  });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
