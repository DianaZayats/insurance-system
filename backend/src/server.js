require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Мідлвари
app.use(cors({ origin: '*' })); // Дозволяємо запити з будь-яких джерел
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ендпоінт перевірки стану сервера
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Підключаємо основні маршрути API
app.use('/api/v1', routes);

// Глобальна обробка помилок
app.use(errorHandler);

// Обробник 404
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
            details: {}
        }
    });
});

// Ініціалізуємо базу та запускаємо сервер
async function start() {
    try {
        await db.initialize();
        console.log('Database initialized');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api/v1`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Коректне завершення роботи
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await db.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await db.close();
    process.exit(0);
});

start();

