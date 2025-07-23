const path = require('path')
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const indexRoute = require('./routes/indexroute/index')
const basicRoute = require('./routes/userroutes/authroute')
const userRoute = require('./routes/userroutes/basicroutes')

const db = require("./db/databaseconnection");

const app = express();
const Port = process.env.PORT;


app.use(cors({
    origin: 'https://localhost:3000',
    credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: true },
}));

app.set('view engine', "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));    
// app.use(express.static(path.join(__dirname, "public/js/frontendfiles")));    
app.use(express.static(path.join(__dirname, "public/js")));    

db();

app.use('/', indexRoute);
app.use('/secure/ctb/', basicRoute);
app.use('/udp/', userRoute);

app.listen(Port, () => {
    console.log(`server running on https://localhost:${Port}`);
});