const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
const DATA_FILE = path.join(__dirname, 'data', 'turbines.json');
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Помилка читання даних:', error);
        return [];
    }
}
function writeData(data) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Помилка запису даних:', error);
        return false;
    }
}
app.get('/api/turbines', (req, res) => {
    const consumers = readData();
    res.json(consumers);
});
app.post('/api/turbines', (req, res) => {
    try {
        const { name, type, coords, power, count, height, diameter } = req.body;
        if (!name || !power || !coords) {
            return res.status(400).json({ success: false, message: 'Заповніть обов’язкові поля' });
        }
        const newTurbine = {
            id: Date.now().toString(),
            name,
            type,
            coords, 
            power: parseFloat(power),
            count: parseInt(count),
            height: parseFloat(height),
            diameter: parseFloat(diameter),
            totalPower: parseFloat(power) * parseInt(count), 
            registrationDate: new Date().toISOString()
        };
        const turbines = readData();
        turbines.push(newTurbine);
        writeData(turbines);

        res.status(201).json({ success: true, data: newTurbine });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});
app.delete('/api/turbines/:id', (req, res) => {
    try {
        const idForDelete = req.params.id; 
        let turbines = readData(); 
        const filteredTurbines = turbines.filter(t => t.id !== idForDelete);
        if (turbines.length === filteredTurbines.length) {
            return res.status(404).json({ success: false, message: 'Об\'єкт не знайдено' });
        }
        writeData(filteredTurbines); 
        res.json({ success: true, message: 'Видалено успішно' });
    } catch (error) {
        console.error('Помилка видалення:', error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});