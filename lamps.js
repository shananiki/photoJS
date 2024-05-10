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

var nextID = 4;

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
		const sql = `SELECT description FROM lamp WHERE lampID = ?`;
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

		const sql = `SELECT date FROM lamp WHERE lampID = ?`;
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
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'images'));
    },
    filename: function (req, file, cb) {
        cb(null, nextID + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get next lampID
async function getNextLampID() {
	const connection = await pool.getConnection();
	const sql = 'SELECT AUTO_INCREMENT AS nextID FROM information_schema.TABLES WHERE TABLE_NAME = "lamps";';
	
	const [rows] = await connection.execute(sql); 
	connection.release();
	console.log(rows[1]['nextID']);
	return rows[1]['nextID'].toString();
}

async function initializeNextID() {
	try {
		nextID = await getNextLampID();
		console.log('Initial nextID:', nextID);
	} catch (error) {
		console.error('Error initializing nextID:', error);
		// You may handle the error here, like exiting the process or setting a default value for nextID
	}
}


// Upload route
app.post('/upload', upload.single('image'), async (req, res) => {
	const description = req.body.description;
	const date = req.body.date;
	const image = req.file.filename;
	try {
		nextID = await getNextLampID();
	} catch (error) {
		console.error(error);
		return res.status(500).send('Error retrieving next lamp ID');
	}
	// Check if all fields are provided
	//if (!image || !description || !date) {
	//  return res.status(400).send('Please fill out all fields');
	//}
	if(!image){
		console.log("Image is null");
	}
	if(!description){
		console.log("description is null");
	}
	if(!date){
		console.log("date is null");
	}
	// Insert data into database
	try {

		const connection = await pool.getConnection();
		const sql = `INSERT INTO lamp (lampID, image, description, date) VALUES (?, ?, ?, ?)`;
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

// initialize ID then do your thing
initializeNextID().then(() => {
	const port = process.env.PORT || 4000;
	app.listen(port, () => console.log(`Server listening on port ${port}`));
});