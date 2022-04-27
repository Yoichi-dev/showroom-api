const express = require('express');
const MY_SQL = require('mysql');
const router = express.Router();
const constants = require('../constants');
const common = require('../common');
const { check, validationResult } = require('express-validator');
let mysql_setting = common.mysqlSetting();

/* イベントAPI */
router.get('/', function (req, res, next) {
  res.json({ title: 'Events API' });
});

/* イベント一覧 */
router.get('/list', common.asyncWrapper(async (req, res, next) => {
  let connection = MY_SQL.createConnection(mysql_setting);
  await common.dbConnect(connection);

  let db_events = await common.exeSql(connection, constants.sql.eventList);

  connection.end();
  res.json(db_events);
}));

/* 開催中イベント一覧 */
router.get('/hold', common.asyncWrapper(async (req, res, next) => {
  let connection = MY_SQL.createConnection(mysql_setting);
  await common.dbConnect(connection);

  let time = Math.round(new Date().getTime() / 1000);

  let db_events = await common.exeSqlPlace(connection, constants.sql.holdEventList, [time, time]);

  connection.end();
  res.json(db_events);
}));

/* 終了済イベント一覧 */
router.get('/end', common.asyncWrapper(async (req, res, next) => {
  let connection = MY_SQL.createConnection(mysql_setting);
  await common.dbConnect(connection);

  let time = Math.round(new Date().getTime() / 1000);

  let db_events = await common.exeSqlPlace(connection, constants.sql.endEventList, [time]);

  connection.end();
  res.json(db_events);
}));

/* イベント情報 */
router.get('/info/:event_id', [check('event_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  let connection = MY_SQL.createConnection(mysql_setting);
  await common.dbConnect(connection);

  let db_history = await common.exeSqlPlace(connection, constants.sql.eventDataList, [req.params.event_id]);

  connection.end();
  res.json(db_history);
}));

/* イベント参加ユーザ */
router.get('/users/:event_id', [check('event_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  let connection = MY_SQL.createConnection(mysql_setting);
  await common.dbConnect(connection);

  // イベントのユーザ一覧を取得
  let db_event_user = await common.exeSqlPlace(connection, constants.sql.eventUserList, [req.params.event_id, req.params.event_id]);

  connection.end();
  res.json(db_event_user);
}));

module.exports = router;
