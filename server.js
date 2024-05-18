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
        name TEXT,
        password TEXT
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

app.post('/api/data', (req, res) => {
    console.log(req.body); 
    res.json(req.body);
});

app.post('/api/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { name: req.body.name, password: hashedPassword };

        // Check if user already exists
        db.get(`SELECT * FROM users WHERE name = ?`, [user.name], (err, row) => {
            if (err) {
                return console.log(err.message);
            }

            // If the user exists, send a response and return
            if (row) {
                res.status(200).send({ error: true, message: 'Username already exists' });
                return;
            }

            // If the user does not exist, insert the new user into the users table
            db.run(`INSERT INTO users(name, password) VALUES(?, ?)`, [user.name, user.password], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                // get the last insert id
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            });

            console.log('User registered successfully');
            res.status(201).send({ error: false, message: 'User registered successfully' });
        });
    } catch {
        res.status(500).send();
    }
});

app.post('/api/login', async (req, res) => {
    db.get(`SELECT * FROM users WHERE name = ?`, [req.body.name], async (err, row) => {
        if (err) {
            return console.log(err.message);
        }

        if (row) {
            try {
                if (await bcrypt.compare(req.body.password, row.password)) {
                    console.log('User logged in successfully');
                    const accessToken = jwt.sign(row, process.env.ACCESS_TOKEN_SECRET);
                    res.json({ accessToken: accessToken });
                } else {
                    res.status(200).send({ error: true, message: 'Username or password is incorrect' });
                }
            } catch {
                res.status(500).send();
            }
        } else {
            res.send({ error: true, message: 'Username or password is incorrect' });
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