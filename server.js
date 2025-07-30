require("dotenv").config();
require('./jobs/cronjobs');
const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const expressSanitizer = require("express-sanitizer");
const MongoStore = require("connect-mongo");

const indexRoute = require("./routes/indexroute/index");
const basicRoute = require("./routes/userroutes/authroute");
const userRoute = require("./routes/userroutes/basicroutes");
const postRoutes = require("./routes/userroutes/userpostroutes");

const db = require("./db/databaseconnection");

const app = express();
const Port = process.env.PORT;

db();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSanitizer());

app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      ttl: 14 * 24 * 60 * 60,
      autoRemove: "interval",
      autoRemoveInterval: 10,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/js")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", indexRoute);
app.use("/user/secure/ctb/", postRoutes);
app.use("/secure/ctb/", basicRoute);
app.use("/udp/", userRoute);

app.use((req, res) => {
  res.status(404).render("404", { url: req.originalUrl });
});

app.listen(Port, () => {
  console.log(`server running on http://localhost:${Port}`);
});
