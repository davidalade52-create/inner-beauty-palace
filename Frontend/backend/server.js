const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '../')));

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

// --- ENDPOINTS ---

// Submit New Registration
app.post('/api/student/register', async (req, res) => {
    try {
        const { fullName, email, phone, gender, location, motivation } = req.body;

        if (!fullName || !email || !phone || !gender || !location || !motivation) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Check duplicate email
        const existing = await Registration.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'This email is already registered.' });
        }

        // Generate a unique registration access code
        const registrationCode = 'IBP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const record = await Registration.create({
            fullName,
            email,
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

// Student Lookup: Allow students to check details using Email or Code
app.post('/api/student/lookup', async (req, res) => {
    try {
        const { query } = req.body; // Can be email or registrationCode

        if (!query) {
            return res.status(400).json({ error: 'Please enter your email or registration code.' });
        }

        const student = await Registration.findOne({
            where: {
                [Op.or]: [
                    { email: query },
                    { registrationCode: query }
                ]
            }
        });

        if (!student) {
            return res.status(404).json({ error: 'No registration record found.' });
        }

        res.status(200).json({ data: student });
    } catch (err) {
        console.error('Lookup search error:', err);
        res.status(500).json({ error: 'Search failed.' });
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));