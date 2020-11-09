const path = require('path');
const express = require("express");
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError   = require('./utilities/appError');
const globalErrorHandler = require('./Controllers/errorController');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const reviewRouter = require('./Routes/reviewRoutes');


const app = express();


app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'));

////////////////////////////////////////////////////////////
////Middleware 
////////////////////////////////////////////////////////////

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security http headers
app.use(helmet());

// Development login
if(process.env.node_env === 'deployment') {
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api',limiter);

// BOdy parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Serving static files
app.use(express.static(`${__dirname}/public`));


// Data sanitization against NoSQL querry injection
app.use(mongoSanitize());

// Data sanitization againt xss
app.use(xss());

//Prevent Parameter pollution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        //.....you can add more like that
    ]
}));

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date(). toISOString();
    // console.log(req.headers);

    next();
});

//Routes
app.get('/', (req,res) => {
    res.status(200).render('base')
})

app.use( '/api/v1/tours', tourRouter);
app.use( '/api/v1/User', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*',(req,res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server!`
    // })
    // const err = new Error(`can't find ${req.originalUrl} on this server`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError( `Can't find ${req.originalUrl} on this server!, 404`));
});

app.use(globalErrorHandler);

module.exports = app



