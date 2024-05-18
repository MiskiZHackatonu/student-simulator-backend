// Step 4: Import Express.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();


let db = new sqlite3.Database('./db/sample.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Users table created successfully.');
            }
        });
    }
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/registerOrLogin', (req, res) => {
    const { name } = req.body;

    console.log(name);
    // create user if doesnt exist, else login
    db.get(`SELECT * FROM users WHERE name = ?`, [name], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: true, message: 'Internal server error' });
        } else {
            if (row) {
                // login
                res.json({ message: 'User logged in successfully' });
            } else {
                // register
                db.run(`INSERT INTO users (name) VALUES (?)`, [name], (err) => {
                    if (err) {
                        console.error(err.message);
                        res.status(500).json({ error: true, message: 'Internal server error' });
                    } else {
                        res.json({ message: 'User registered successfully' });
                    }
                });
            }
        }
    });
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on('exit', () => {
    db.close();
});