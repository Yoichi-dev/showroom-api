const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const rfs = require("rotating-file-stream").createStream;

require('dotenv').config();
const ENV = process.env;

const logDirectory = path.join(__dirname, './log');
if (!ENV.HEROKU) {
  fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
}

const indexRouter = require('./routes/index');
const liveRouter = require('./routes/live');
const minecraftRouter = require('./routes/minecraft');
const otherRouter = require('./routes/other');
const roomRouter = require('./routes/room');
const usersRouter = require('./routes/users');
const eventsRouter = require('./routes/events');
const historyRouter = require('./routes/history');

const app = express();

app.use(helmet());

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
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
  } else {
    res.status(401).json({ status: "401 Unauthorized" });
  }
});

if (!ENV.HEROKU) {
  const accessLogStream = rfs('access.log', {
    interval: '1d',
    compress: 'gzip',
    path: logDirectory
  });
  app.use(logger('combined', { stream: accessLogStream }))
} else {
  app.use(logger('combined'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/live', liveRouter);
app.use('/minecraft', minecraftRouter);
app.use('/other', otherRouter);
app.use('/room', roomRouter);
app.use('/users', usersRouter);
app.use('/events', eventsRouter);
app.use('/history', historyRouter);

app.use((req, res, next) => {
  res.status(404).json({ status: "404 not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ status: "500 Internal Server Error" });
});

module.exports = app;
