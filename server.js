const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const { recordRaceResult } = require('./js/race_recorder');

const app = express();
const PORT = 3000;

// Serve static files (JS, CSS, HTML)
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // Change this if needed
    password: 'admin*6798',  // Change this if needed
    database: 'furytype'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
});

// ✅ Save a new race result
app.post('/record-race', (req, res) => {
    console.log("Received race result:", req.body);
    recordRaceResult(req.body);
    res.json({ message: 'Race result recorded' });
});

// ✅ Fetch the latest 10 race records
app.get('/get-races', (req, res) => {
    const sql = 'SELECT sno, dateTime, duration, wpm, accuracy FROM typing_records ORDER BY dateTime DESC LIMIT 10';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ message: 'Error fetching race results' });
            return;
        }
        res.json(results);
    });
});

// ✅ Edit a race record (update WPM & Accuracy)
app.put('/edit-race/:sno', (req, res) => {
    const { sno } = req.params;
    const { wpm, accuracy } = req.body;
    const sql = 'UPDATE typing_records SET wpm = ?, accuracy = ? WHERE sno = ?';

    db.query(sql, [wpm, accuracy, sno], (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            res.status(500).json({ message: 'Error updating race result' });
            return;
        }
        res.json({ message: 'Race result updated successfully' });
    });
});

// ✅ Delete a race record
app.delete('/delete-race/:sno', (req, res) => {
    const { sno } = req.params;
    const sql = 'DELETE FROM typing_records WHERE sno = ?';

    db.query(sql, [sno], (err, result) => {
        if (err) {
            console.error('Error deleting data:', err);
            res.status(500).json({ message: 'Error deleting race result' });
            return;
        }
        res.json({ message: 'Race result deleted successfully' });
    });
});

// ✅ Search for a specific race record by Date
app.get('/search-race/:date', (req, res) => {
    const { date } = req.params;
    const sql = 'SELECT sno, dateTime, duration, wpm, accuracy FROM typing_records WHERE DATE(dateTime) = ? ORDER BY dateTime DESC';

    db.query(sql, [date], (err, result) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ message: 'Error fetching race result' });
            return;
        }
        res.json(result);
    });
});



// ✅ Serve index.html from root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ✅ Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
