const express = require('express');
const dotenv = require('dotenv');
const dentists = require('./routes/dentists');
const auth = require('./routes/auth');
const connectDB = require('./config/db');
const bookings = require('./routes/bookings');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
dotenv.config({ path: './config/config.env'});

connectDB();

const app = express();
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());

const limiter = rateLimit ({
    windowMs:10*60*1000,
    max:100
});
app.use(limiter);
app.use(hpp());
app.use(cors());
app.use('/api/dentists', dentists);
app.use('/api/auth', auth);
app.use('/api/bookings', bookings);


const PORT = process.env.PORT || 5000;
const server = app.listen(
    PORT,
    console.log(
      "Server running in ",
      process.env.NODE_ENV,
      "on " + process.env.HOST + ":" + PORT,
    )
  );

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});