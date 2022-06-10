const express = require('express');
const mysql = require('mysql2');
const router = express.Router();
const common = require('../common');
const { check, validationResult } = require('express-validator');

const constants = require('../constants');

/* 履歴API */
router.get('/', function (req, res, next) {
  res.json({ title: 'History API' });
});

/* イベント履歴 */
router.get('/:event_id', [check('event_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);

  let db_history = await common.selectDb(connection, constants.sql.select.historyList, [req.params.event_id]);

  connection.end();
  res.json(db_history);
}));

/* イベント集計用 */
router.get('/aggregate/:event_id', [check('event_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);

  let db_history = await common.selectDb(connection, constants.sql.select.aggregateList, [req.params.event_id, req.params.event_id]);

  connection.end();
  res.json(db_history);
}));

/* 履歴（個別） */
router.get('/:event_id/:room_id', [check('event_id').not().isEmpty().isNumeric(), check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);

  let db_history = await common.selectDb(connection, constants.sql.select.userHistoryList, [req.params.event_id, req.params.room_id]);

  connection.end();
  res.json(db_history);
}));

module.exports = router;