const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const path = require("path");

process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

// Load cron jobs safely
try {
  require("./jobs/cronjobs");
  require("./jobs/loancronjob");
} catch (cronErr) {
  console.error("⚠️ Error initializing cron jobs:", cronErr.message);
}

const indexRoute = require("./routes/indexroute/index");
const basicRoute = require("./routes/userroutes/authroute");
const userRoute = require("./routes/userroutes/basicroutes");
const postRoutes = require("./routes/userroutes/userpostroutes");
const chatRoutes = require("./routes/userroutes/chatroutes");
const adminRoutes = require("./routes/adminRoutes");

const db = require("./db/databaseconnection");

const app = express();
const Port = process.env.PORT || 3000;

// Enable trust proxy for Railway / reverse proxy SSL termination
app.set("trust proxy", 1);

// Connect Database
db();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.MONGOHQ_URL ||
  process.env.DATABASE_URL ||
  "mongodb://127.0.0.1:27017/bankapp";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_ctb_session_secret_2026",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      touchAfter: 24 * 3600,
      crypto: {
        secret: process.env.SESSION_SECRET || "fallback_ctb_session_secret_2026",
      },
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/js")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Mount routes with multi-URL compatibility
app.use("/", indexRoute);
app.use("/user/secure/ctb/", postRoutes);
app.use("/user/secure/fubank/", postRoutes);
app.use("/secure/ctb/", basicRoute);
app.use("/secure/fubank/", basicRoute);
app.use("/udp/", userRoute);
app.use("/user/api/support-chat", chatRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).render("404", { url: req.originalUrl });
});

// Bind to 0.0.0.0 for Railway container deployment
app.listen(Port, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${Port}`);
});
