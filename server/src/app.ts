import express from 'express';
import authRouter from './routers/auth-router'
import profileRouter from './routers/profile-router'
import questionRouter from './routers/question-router'
import tagRouter from './routers/tag-router'
import passport from 'passport'
import session from 'express-session'
var MySQLStore = require('express-mysql-session')(session);
import pool from './mysql-pool';

const app = express();

app.use(express.json());


const options = {
	host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    port: 3306,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
};


// Serve client files

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(options, pool)
  }));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'));


app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/questions', questionRouter);
app.use('/api/v1/tags', tagRouter);

export default app;

