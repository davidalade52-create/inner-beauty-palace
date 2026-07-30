require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- EMAIL TRANSPORTER CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'davidalade52@gmail.com', 
        pass: process.env.EMAIL_PASS || 'rfslmlezetulpkpn'
    }
});

// Verify email connection on startup
transporter.verify((error) => {
    if (error) {
        console.error('❌ Email Transporter Error:', error.message);
    } else {
        console.log('✅ Mail server ready to send messages');
    }
});

// 1. Initialize SQLite Database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
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
    .then(() => console.log('✅ Database connected & synced successfully!'))
    .catch((err) => console.error('❌ Database sync error:', err));

// --- API ENDPOINTS ---

// Submit New Registration
app.post('/api/student/register', async (req, res) => {
    try {
        const { fullName, email, phone, gender, location, motivation } = req.body;

        if (!fullName || !email || !phone || !gender || !location || !motivation) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await Registration.findOne({ where: { email: normalizedEmail } });
        if (existing) {
            return res.status(409).json({ error: 'This email is already registered.' });
        }

        const registrationCode = 'IBP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // 1. Save student to database
        const record = await Registration.create({
            fullName,
            email: normalizedEmail,
            phone,
            gender,
            location,
            motivation,
            registrationCode
        });

        // 2. Send instant response to frontend (prevents hanging on screen)
        res.status(201).json({
            message: 'Registration saved successfully!',
            registrationCode: record.registrationCode,
            data: record
        });

        // 3. Send email notification asynchronously in the background
        const mailOptions = {
            from: `Inner Beauty Palace <${process.env.EMAIL_USER || 'davidalade52@gmail.com'}>`,
            to: process.env.EMAIL_USER || 'davidalade52@gmail.com',
            subject: `🎉 New Masterclass Registration: ${record.fullName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0b44f; border-radius: 10px; max-width: 500px;">
                    <h2 style="color: #4a154b; margin-bottom: 15px;">New Student Registered!</h2>
                    <p><strong>Full Name:</strong> ${record.fullName}</p>
                    <p><strong>Email:</strong> ${record.email}</p>
                    <p><strong>WhatsApp:</strong> ${record.phone}</p>
                    <p><strong>Gender:</strong> ${record.gender}</p>
                    <p><strong>Location:</strong> ${record.location}</p>
                    <p><strong>Registration Code:</strong> <span style="color: #e0b44f; font-weight: bold; font-size: 1.1rem;">${record.registrationCode}</span></p>
                    <p><strong>Motivation:</strong> ${record.motivation}</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (mailErr, info) => {
            if (mailErr) {
                console.error('❌ Background Email Error:', mailErr.message);
            } else {
                console.log('✅ Background Notification Email Sent:', info.response);
            }
        });

    } catch (err) {
        console.error('Error saving registration:', err);
        res.status(500).json({ error: 'Server error saving registration.' });
    }
});

// Student Lookup: Efficient Direct Database Query
app.post('/api/student/lookup', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || !query.trim()) {
            return res.status(400).json({ error: 'Please enter your email or registration code.' });
        }

        const cleanQuery = query.trim().toLowerCase();

        // Direct SQL lookup using OR operator
        const student = await Registration.findOne({
            where: {
                [Op.or]: [
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('email')), cleanQuery),
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('registrationCode')), cleanQuery)
                ]
            }
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

// Admin Lookup
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
// Static files served from parent directory (Frontend)
app.use(express.static(path.join(__dirname, '../')));

// Named wildcard param required by Express 5 / Node v24 (path-to-regexp v8 fix)
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));