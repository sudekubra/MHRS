const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rest of the application is served as static files
app.use(express.static(path.join(__dirname)));

const symptomDictionary = {
    'böbrek': 'İç Hastalıkları (Dahiliye)',
    'idrar': 'Üroloji',
    'sırt': 'Fizik Tedavi ve Rehabilitasyon',
    'bel': 'Fizik Tedavi ve Rehabilitasyon',
    'göz': 'Göz Hastalıkları',
    'görme': 'Göz Hastalıkları',
    'kalp': 'Kardiyoloji',
    'göğüs': 'Göğüs Hastalıkları',
    'nefes': 'Göğüs Hastalıkları',
    'baş': 'Nöroloji',
    'mide': 'İç Hastalıkları (Dahiliye)',
    'karın': 'Genel Cerrahi',
    'boğaz': 'Kulak Burun Boğaz',
    'kulak': 'Kulak Burun Boğaz',
    'burun': 'Kulak Burun Boğaz',
    'saç': 'Cildiye (Dermatoloji)',
    'deri': 'Cildiye (Dermatoloji)',
    'cilt': 'Cildiye (Dermatoloji)',
    'kemik': 'Ortopedi ve Travmatoloji',
    'kırık': 'Ortopedi ve Travmatoloji',
    'diş': 'Diş Hekimliği'
};

// REST API for symptom checking
app.post('/api/symptoms', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Symptom text is required' });
    }

    const lowerText = text.toLowerCase().trim();
    let recommendedDepts = new Set();

    for (const [keyword, dept] of Object.entries(symptomDictionary)) {
        if (lowerText.includes(keyword)) {
            recommendedDepts.add(dept);
        }
    }

    res.json({ departments: Array.from(recommendedDepts) });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('REST API -> POST /api/symptoms');
});
