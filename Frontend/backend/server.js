const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.get('/', (req, res) => {
  res.send('Welcome to Inner Beauty Palace API!');
});
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Initialize SQLite Database (Creates a database.sqlite file automatically)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// 2. Define Registration Data Model
const Registration = sequelize.define('Registration', {
    fullName: { type: DataTypes.STRING, allowNullable: false },
    email: { type: DataTypes.STRING, allowNullable: false, unique: true },
    phone: { type: DataTypes.STRING, allowNullable: false },
    gender: { type: DataTypes.STRING, allowNullable: false },
    location: { type: DataTypes.STRING, allowNullable: false },
    motivation: { type: DataTypes.TEXT, allowNullable: false },
    registrationCode: { type: DataTypes.STRING, unique: true }
});

// Sync Database Schema
sequelize.sync().then(() => console.log('Database connected & synced successfully!'));

// --- ENDPOINTS ---

// Submit New Registration
app.post('/api/register', async (req, res) => {
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

        // Generate a unique registration access code for the student
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
        res.status(500).json({ error: 'Server error saving registration.' });
    }
});

// Student Lookup: Allow students to check their registration details using Email or Code
app.post('/api/student/lookup', async (req, res) => {
    try {
        const { query } = req.body; // Can be email or registrationCode
        const student = await Registration.findOne({
            where: Sequelize.or({ email: query }, { registrationCode: query })
        });

        if (!student) {
            return res.status(404).json({ error: 'No registration record found.' });
        }

        res.status(200).json({ data: student });
    } catch (err) {
        res.status(500).json({ error: 'Search failed.' });
    }
});

// Admin Lookup: View all registered students
app.get('/api/admin/registrations', async (req, res) => {
    const students = await Registration.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json({ total: students.length, students });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));