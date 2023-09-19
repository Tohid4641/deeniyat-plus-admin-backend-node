// constants
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const usersRoutes = require('./routes/users.routes');
const cookieParser = require('cookie-parser');
const app = express();
dotenv.config();

// pg database
// require('./configs/db.config');

// configs
const { LOCAL_PORT,SERVER_PORT } = process.env;

// template engine
app.set("view engine", "ejs");
app.set("views", "./views");

// middlewares
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
app.use(morgan("short"));
app.use(cors());
app.use(cookieParser());

// static path for images
app.use('/api/public',express.static('public'));

// express.js
app.get("/api", function (req, res) {
    res.render("Home", { title: "Express" });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", usersRoutes);

// error handling
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  res.status(err.statusCode).json({
    message: err.message,
  });
});

// 404 not found page
app.use( (req, res) => {
    res.status(404).render('notFound');
});

// localhost
// app.listen(LOCAL_PORT, () =>
//   console.log(
//     `---------------------------------------------------------------------
// Server Listening :::: http://localhost:${LOCAL_PORT}/api`
//   )
// );

// For Deeniyat Plus Server

const https = require('https');

const fs = require('fs');

// const options = {

//  key: fs.readFileSync('/etc/letsencrypt/live/api.deeniyatplus.com/privkey.pem'),
//  cert: fs.readFileSync('/etc/letsencrypt/live/api.deeniyatplus.com/fullchain.pem'),

// };

// const dp_server = https.createServer(options, app);

app.listen( SERVER_PORT, () =>

 console.log(
 `---------------------------------------------------------------------
Server Listening :::: https://deeniyat-plus.app.redbytes.in:${SERVER_PORT}/api`
 )

);
