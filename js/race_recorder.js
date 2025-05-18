const mysql = require('mysql2');
const EventEmitter = require('events');

const raceEmitter = new EventEmitter(); // Create an EventEmitter instance

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // Change this to your MySQL username
    password: 'admin*6798',  // Change this to your MySQL password
    database: 'furytype'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// Function to properly format date for MySQL
function formatDateForMySQL(isoDateString) {
    const date = new Date(isoDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;  // MySQL DATETIME format
}

// Function to record race results in MySQL
function recordRaceResult(result) {
    let { sno, dateTime, duration, wpm, accuracy, paragraph } = result;

    // ✅ Convert ISO datetime to MySQL DATETIME format
    let formattedDateTime = formatDateForMySQL(dateTime);

    const sql = 'INSERT INTO typing_records (sno, dateTime, duration, wpm, accuracy, paragraph) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(sql, [sno, formattedDateTime, duration, wpm, accuracy, paragraph], (err, res) => {
        if (err) {
            console.error('Error inserting data:', err);
            return;
        }
        console.log(`Race result inserted`);
        raceEmitter.emit('raceRecorded', result); // Emit event after successful insertion
    });
}

module.exports = { recordRaceResult, raceEmitter };
