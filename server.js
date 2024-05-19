// Step 4: Import Express.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const score = 100
games_lobby = {

}


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

        // Create games user score table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS games_users_score (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        user_id INTEGER,
        score INTEGER,
        FOREIGN KEY(game_id) REFERENCES games(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Games users score table created successfully.');
            }
        });
    }
});

async function setScore(req, res, gameId, userId, score) {
    db.get(`SELECT * FROM games_users_score WHERE game_id = ? AND user_id = ?`, [gameId, userId], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send({ error: 'Database error' });
            return;
        } else if (row) {
            // If an entry with the same game_id and user_id already exists, update the score
            db.run(`UPDATE games_users_score SET score = ? WHERE game_id = ? AND user_id = ?`, [score, gameId, userId], (err) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send({ error: 'Database error' });
                    return;
                }
                res.status(200).send({ message: 'Score updated successfully' });
            });
        } else {
            // If no entry with the same game_id and user_id exists, insert a new entry
            db.run(`INSERT INTO games_users_score (game_id, user_id, score) VALUES (?, ?, ?)`, [gameId, userId, score], (err) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send({ error: 'Database error' });
                    return;
                }
                res.status(201).send({ message: 'Score inserted successfully' });
            });
        }
    });
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/registerOrLogin', (req, res) => {
    const { name } = req.body;
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


app.post('/games/setScore', (req, res) => {
    const { userId, gameId } = req.body;

    setScore(req, res, gameId, userId, score);

    res.status(200).send({ message: 'Score updated successfully' });
});

// Endpoint for matchmaking for game6
app.post('/games/6/matchmaking', async (req, res) => {
    const { lobbyId, userId } = req.body;

    console.log(games_lobby[lobbyId]);

    if (games_lobby[lobbyId] == undefined) {
        games_lobby[lobbyId] = {
            users: [userId],
            userId: false
        };

        // Wait for other user to join
        try {
            await new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (games_lobby[lobbyId].users.length > 1) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 1000); // Check every second

                // Timeout after 60 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout waiting for other user to join'));
                }, 60000);
            });
            // delete 
            delete games_lobby[lobbyId];
            res.status(200).send({ message: 'Matchmaking successful', id: 1 });
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    } else if (games_lobby[lobbyId].users.length == 1) {
        games_lobby[lobbyId].users.push(userId);
        games_lobby[lobbyId].userId = false;
        res.status(200).send({ message: 'Matchmaking successful', id: 2 });
    }
    else {
        res.status(400).send({ message: 'Lobby is full' });
    }

    console.log(games_lobby);
});

app.post('/games/6/solved', async (req, res) => {
    const { lobbyId, userId } = req.body;

    games_lobby[lobbyId].userId = true;

    try {
        await new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (!games_lobby[lobbyId]) {
                    clearInterval(checkInterval);
                    reject(new Error('Lobby was deleted by other user'));
                    return;
                }

                const users = Object.keys(games_lobby[lobbyId]);
                const allSolved = users.every(user => games_lobby[lobbyId][user]);

                if (allSolved) {
                    clearInterval(checkInterval);
                    // Set score for each user in the lobby
                    setScore(req, res, 6, userId, score);
                    // Check if lobby still exists before trying to delete it
                    if (games_lobby[lobbyId]) {
                        delete games_lobby[lobbyId];
                    }
                    resolve();
                }
            }, 1000); // Check every second
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

app.get('/games/scores', (req, res) => {
    db.all(`SELECT * FROM games_users_score`, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send({ error: 'Database error' });
            return;
        }
        res.status(200).send(rows);
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