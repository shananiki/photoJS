const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');


const app = express();
const imagesDir = path.join(__dirname, 'images');

app.use(express.static('public'));
app.use('/images', express.static(imagesDir));


const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'Regenbogen1!',
  database: 'lamp'
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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on port ${port}`));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
