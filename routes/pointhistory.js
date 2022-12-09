const express = require('express');
const mysql = require('mysql2');
const router = express.Router();
const common = require('../common');
const { check, validationResult } = require('express-validator');

const constants = require('../constants');

/* PointHistory用API */
router.get('/', function (req, res, next) {
  res.json({ title: 'PointHistory API' });
});

/* イベント情報 */
router.get('/event/:event_id', [check('event_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);
  let allData = {
    eventInfo: null,
    eventUser: null,
    eventHistory: null,
    eventAggregate: null
  }
  // イベント情報
  const db_event = await common.selectDb(connection, constants.sql.select.eventDataList, [req.params.event_id]);
  // イベントのユーザ一覧を取得
  const db_event_user = await common.selectDb(connection, constants.sql.select.eventUserList, [req.params.event_id, req.params.event_id]);
  // イベント履歴
  const db_history = await common.selectDb(connection, constants.sql.select.historyList, [req.params.event_id]);
  // イベント集計
  const db_aggregate = await common.selectDb(connection, constants.sql.select.aggregateList, [req.params.event_id, req.params.event_id]);
  allData.eventInfo = db_event[0];
  allData.eventUser = db_event_user;
  allData.eventHistory = db_history;
  allData.eventAggregate = db_aggregate;
  connection.end();
  res.json(allData);
}));

/* ユーザ情報 */
router.get('/event/:event_id/:room_id', [check('event_id').not().isEmpty().isNumeric(), check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);
  // イベント情報
  const db_event = await common.selectDb(connection, constants.sql.select.eventDataList, [req.params.event_id]);
  // プロフィール
  const db_profile = await common.exeApi(`${constants.url.room.profile}${req.params.room_id}`);
  // 個別履歴
  const db_user_history = await common.selectDb(connection, constants.sql.select.userHistoryList, [req.params.event_id, req.params.room_id]);
  // 集計
  const db_aggregate = await common.selectDb(connection, constants.sql.select.aggregateList, [req.params.event_id, req.params.event_id]);
  let allData = {
    eventInfo: null,
    profile: null,
    userHistory: null,
    eventAggregate: null
  }
  allData.eventInfo = db_event[0];
  allData.profile = db_profile;
  allData.userHistory = db_user_history;
  allData.eventAggregate = db_aggregate;
  connection.end();
  res.json(allData);
}));

/* イベント存在チェック */
router.post('/check', [check('event_id').not().isEmpty().isNumeric(), check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);
  // チェック
  const db_check = await common.selectDb(connection, constants.sql.select.check, [req.params.event_id, req.params.room_id]);
  let checkFlg = true;
  if (db_check[0].count === 0) {
    checkFlg = false;
  }
  connection.end();
  res.json(checkFlg);
}));

module.exports = router;