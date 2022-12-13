const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rfs = require("rotating-file-stream").createStream;
const moment = require('moment-timezone');

const timezone = 'Asia/Tokyo';

logger.token('date', () => {
  return moment().tz(timezone).format();
});

require('dotenv').config({ path: path.join(__dirname, ".env") });
const ENV = process.env;

const logDirectory = path.join(__dirname, './log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const indexRouter = require('./routes/index');
const eventsRouter = require('./routes/events');
const historyRouter = require('./routes/history');
const showroomRouter = require('./routes/showroom');
const pointHistoryRouter = require('./routes/pointhistory');
const watchlogRouter = require('./routes/watchlog');

const app = express();

app.use(helmet());
app.use(bodyParser.json({ limit: '5mb' }));

app.set('trust proxy', 'loopback, linklocal, uniquelocal');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (/^https:\/\/.+\.showroom-app\.com$/.test(origin)
    || /^https:\/\/musica-streaming\.netlify\.app$/.test(origin)
    || /^https:\/\/yukino-comment\.netlify\.app$/.test(origin)
    || /^https:\/\/tem-comment\.netlify\.app$/.test(origin)
    || /^https:\/\/showroom-app-api\.herokuapp\.com$/.test(origin)
    || encodeURI(req.query.key) === ENV.API_KEY) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    next();
  } else {
    res.status(401).json({ status: "401 Unauthorized" });
  }
});

const accessLogStream = rfs('access.log', {
  interval: '1d',
  compress: 'gzip',
  path: logDirectory
});
app.use(logger('combined', { stream: accessLogStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/events', eventsRouter);
app.use('/history', historyRouter);
app.use('/pointhistory', pointHistoryRouter);
app.use('/watchlog', watchlogRouter);
app.use('/showroom', showroomRouter);

app.use((req, res, next) => {
  res.status(404).json({ status: "404 not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ status: "500 Internal Server Error" });
});

module.exports = app;
