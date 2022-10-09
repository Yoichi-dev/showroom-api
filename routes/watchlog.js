const express = require('express');
const router = express.Router();
const constants = require('../constants');
const common = require('../common');
const mysql = require('mysql2');

/* Watch Log API */
router.get('/', function (req, res, next) {
  res.json({ title: 'Watch Log API' });
});

/* 配信ログ取得 */
router.post('/getloglist', common.asyncWrapper(async (req, res, next) => {
  if (req.body.uuid === undefined) {
    res.status(400).json({ status: "400 Bad Request" });
    return
  }
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);
  const logList = await common.selectDb(connection, constants.sql.select.logList, [req.body.uuid]);
  connection.end();
  res.json(logList);
}));

/* 配信ログ取得 */
router.post('/getlog', common.asyncWrapper(async (req, res, next) => {
  if (req.body.uuid === undefined || req.body.log_id === undefined) {
    res.status(400).json({ status: "400 Bad Request" });
    return
  }
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);
  const log = await common.selectDb(connection, constants.sql.select.log, [req.body.uuid, req.body.log_id]);
  connection.end();
  res.json(log);
}));

/* 配信ログ削除 */
router.post('/delete', common.asyncWrapper(async (req, res, next) => {
  if (req.body.uuid === undefined || req.body.log_id === undefined) {
    res.status(400).json({ status: "400 Bad Request" });
    return
  }
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);
  let resData = {
    status: false,
    msg: ''
  }
  try {
    await common.transactionDb(connection, constants.sql.delete.log, [req.body.uuid, req.body.log_id]);
    resData.status = true
    resData.msg = 'success'
  } catch (e) {
    console.log(e)
    resData.msg = '500 Internal Server Error'
  } finally {
    connection.end();
  }
  connection.end();
  res.json(resData);
}));

/* ログ登録 */
router.post('/addlog', common.asyncWrapper(async (req, res, next) => {
  if (req.body.uuid === undefined || req.body.log_id === undefined || req.body.log_json === undefined) {
    res.status(400).json({ status: "400 Bad Request" });
    return
  }

  // UUIDチェック

  let resData = {
    status: false,
    msg: ''
  }

  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);
  // 重複チェック
  const logCount = await common.selectDb(connection, constants.sql.select.logCheck, [req.body.uuid, req.body.log_id]);

  if (logCount[0].count === 0) {
    try {
      await common.transactionDb(connection, constants.sql.insert.log, [req.body.uuid, req.body.log_id, JSON.stringify(req.body.log_json)]);
      resData.status = true
      resData.msg = 'success'
    } catch (e) {
      console.log(e)
      resData.msg = '500 Internal Server Error'
    } finally {
      connection.end();
    }
  } else {
    resData.msg = 'Registered'
    connection.end();
  }
  res.json(resData);
}));

/* 破損データ登録 */
router.post('/corruption', common.asyncWrapper(async (req, res, next) => {
  if (req.body.uuid === undefined || req.body.log_data === undefined) {
    res.status(400).json({ status: "400 Bad Request" });
    return
  }

  // UUIDチェック

  let resData = {
    status: false,
    msg: ''
  }
  const connection = mysql.createConnection(common.mysqlSetting());
  await common.dbConnect(connection);
  // 重複チェック
  const logCount = await common.selectDb(connection, constants.sql.select.corruptionCheck, [req.body.uuid]);
  if (logCount[0].count === 0) {
    try {
      await common.transactionDb(connection, constants.sql.insert.corruption, [req.body.uuid, req.body.log_data]);
      resData.status = true
      resData.msg = 'success'
    } catch (e) {
      console.log(e)
      resData.msg = '500 Internal Server Error'
    } finally {
      connection.end();
    }
  } else {
    resData.msg = 'Registered'
    connection.end();
  }
  res.json(resData);
}));

module.exports = router;
