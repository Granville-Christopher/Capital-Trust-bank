require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const expressSanitizer = require("express-sanitizer");

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
