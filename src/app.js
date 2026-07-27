const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const reservationRoutes = require("./routes/reservation.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(express.json());

app.use(cors());

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests'
    }
});

// app.use(limiter);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Backend API Running'
    });
});
app.use("/api", reservationRoutes);

app.use(errorHandler);

module.exports = app;