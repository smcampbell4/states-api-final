// Load environment variables from .env file
require('dotenv').config();

// Import required packages
const mongoose = require('mongoose');
// Import MongoDB model
const State = require('./model/States');
const express = require('express');
const path = require('path');
const cors = require('cors');
// Import local data (static JSON file)
const statesData = require('./data/statesData.json');
// Initialize Express app
const app = express();
// Set port (use environment variable or default to 3500)
const PORT = process.env.PORT || 3500;

// ==============================
// Middleware
// ==============================

// Enable CORS
app.use(cors());
// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded data
app.use(express.urlencoded({ extended: false }));

// Serve static files from "views" folder
app.use('/', express.static(path.join(__dirname, 'views')));

// GET all states (with optional contiguous filter)
app.get('/states', async (req, res) => {
    let data = statesData.map(state => ({ ...state }));

    const mongoStates = await State.find();

    data = data.map(state => {
        const match = mongoStates.find(m => m.stateCode === state.code);

        if (match && match.funfacts && match.funfacts.length > 0) {
            return { ...state, funfacts: match.funfacts };
        }

        return state;
    });

    if (req.query.contig === 'true') {
        data = data.filter(state => state.code !== 'AK' && state.code !== 'HI');
    }

    if (req.query.contig === 'false') {
        data = data.filter(state => state.code === 'AK' || state.code === 'HI');
    }

    res.json(data);
});

// ==============================
// GET Random Fun Fact
// ==============================
app.get('/states/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const mongoState = await State.findOne({ stateCode });

    if (!mongoState || !mongoState.funfacts || mongoState.funfacts.length === 0) {
        return res.json({ message: `No Fun Facts found for ${state.state}` });
    }

    const randomIndex = Math.floor(Math.random() * mongoState.funfacts.length);

    res.json({
        funfact: mongoState.funfacts[randomIndex]
    });
});

// GET single state by abbreviation
app.get('/states/:state', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();

    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const mongoState = await State.findOne({ stateCode });

    let response = { ...state };

    if (mongoState && mongoState.funfacts && mongoState.funfacts.length > 0) {
    response.funfacts = mongoState.funfacts;
}

    res.json(response);
});

app.get('/states/:state/capital', (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    res.json({ state: state.state, capital: state.capital_city });
});

app.get('/states/:state/nickname', (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    res.json({ state: state.state, nickname: state.nickname });
});

app.get('/states/:state/population', (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    res.json({
        state: state.state,
        population: Number(state.population).toLocaleString('en-US')
    });
});

app.get('/states/:state/admission', (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    res.json({ state: state.state, admitted: state.admission_date });
});

app.post('/states/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    if (!req.body.funfacts) {
        return res.status(400).json({ message: 'State fun facts value required' });
    }

    if (!Array.isArray(req.body.funfacts)) {
        return res.status(400).json({ message: 'State fun facts value must be an array' });
    }

    const newFacts = req.body.funfacts;

    const mongoState = await State.findOne({ stateCode });

    if (!mongoState) {
        const newState = await State.create({
            stateCode,
            funfacts: newFacts
        });
        return res.status(201).json(newState);
    } else {
        mongoState.funfacts = [...mongoState.funfacts, ...newFacts];
        await mongoState.save();
        return res.json(mongoState);
    }
});

// ==============================
// PATCH (Update Fun Fact)
// ==============================

app.patch('/states/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const { index, funfact } = req.body;

    if (!index) {
        return res.status(400).json({ message: 'State fun fact index value required' });
    }

    if (!funfact) {
        return res.status(400).json({ message: 'State fun fact value required' });
    }

    const mongoState = await State.findOne({ stateCode });

    if (!mongoState || !mongoState.funfacts || mongoState.funfacts.length < index) {
        return res.status(400).json({ message: `No Fun Fact found at that index for ${state.state}` });
    }

    mongoState.funfacts[index - 1] = funfact;
    await mongoState.save();

    res.json(mongoState);
});

// ==============================
// DELETE (Remove Fun Fact)
// ==============================
app.delete('/states/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = statesData.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    const { index } = req.body;

    if (!index) {
        return res.status(400).json({ message: 'State fun fact index value required' });
    }

    const mongoState = await State.findOne({ stateCode });

    if (!mongoState || !mongoState.funfacts || mongoState.funfacts.length < index) {
        return res.status(400).json({ message: `No Fun Fact found at that index for ${state.state}` });
    }

    mongoState.funfacts.splice(index - 1, 1);
    await mongoState.save();

    res.json(mongoState);
});

// 404 handler
app.use((req, res) => {
    if (req.accepts('html')) {
        res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.status(404).json({ error: '404 Not Found' });
    } else {
        res.status(404).type('txt').send('404 Not Found');
    }
});

mongoose.connect(process.env.DATABASE_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error(err));

    // ==============================
// Start Server
// ==============================

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});