const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Initialize SQLite Database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// 2. Define Registration Data Model
const Registration = sequelize.define('Registration', {
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    motivation: { type: DataTypes.TEXT, allowNull: false },
    registrationCode: { type: DataTypes.STRING, unique: true }
});

// Sync Database Schema
sequelize.sync()
    .then(() => console.log('Database connected & synced successfully!'))
    .catch((err) => console.error('Database sync error:', err));

// --- API ENDPOINTS ---

// Submit New Registration
app.post('/api/student/register', async (req, res) => {
    try {
        const { fullName, email, phone, gender, location, motivation } = req.body;

        if (!fullName || !email || !phone || !gender || !location || !motivation) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const existing = await Registration.findOne({ where: { email: email.trim().toLowerCase() } });
        if (existing) {
            return res.status(409).json({ error: 'This email is already registered.' });
        }

        const registrationCode = 'IBP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const record = await Registration.create({
            fullName,
            email: email.trim().toLowerCase(),
            phone,
            gender,
            location,
            motivation,
            registrationCode
        });

        res.status(201).json({
            message: 'Registration saved successfully!',
            registrationCode: record.registrationCode,
            data: record
        });

    } catch (err) {
        console.error('Error saving registration:', err);
        res.status(500).json({ error: 'Server error saving registration.' });
    }
});

// Student Lookup: Fail-safe memory lookup
app.post('/api/student/lookup', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || !query.trim()) {
            return res.status(400).json({ error: 'Please enter your email or registration code.' });
        }

        const cleanQuery = query.trim().toLowerCase();

        const allRegistrations = await Registration.findAll();
        
        const student = allRegistrations.find(item => {
            const emailMatch = item.email && item.email.toLowerCase() === cleanQuery;
            const codeMatch = item.registrationCode && item.registrationCode.toLowerCase() === cleanQuery;
            return emailMatch || codeMatch;
        });

        if (!student) {
            return res.status(404).json({ error: 'No registration record found.' });
        }

        return res.status(200).json({ data: student });
    } catch (err) {
        console.error('CRITICAL LOOKUP ERROR:', err);
        return res.status(500).json({ error: 'Search failed: ' + err.message });
    }
});

// Admin Lookup: View all registered students
app.get('/api/admin/registrations', async (req, res) => {
    try {
        const students = await Registration.findAll({ order: [['createdAt', 'DESC']] });
        res.status(200).json({ total: students.length, students });
    } catch (err) {
        console.error('Admin fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch registrations.' });
    }
});

// --- SERVE STATIC FRONTEND ---
app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));