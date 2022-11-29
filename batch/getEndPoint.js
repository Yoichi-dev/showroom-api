'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, ".env") });
const mysql = require('mysql2');
const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");
const Line = require('../line');
const myLine = new Line();

const common = require('../common');

// 設定値
const constants = require('../constants');
const env = process.env;

// 接続情報
const connection = mysql.createConnection(common.mysqlSetting());

// LINEトークン
myLine.setToken(env.LINE_API_KEY);

// 現在日時
let date = new Date();
let endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, "21", "59", "59");
let endUnixDate = Math.round(endDate.getTime() / 1000);

const getAt = endUnixDate;

(async () => {
  console.log('処理開始');
  try {
    // DB接続
    await common.dbConnect(connection);
  } catch (e) {
    console.log('---異常終了---');
    console.log(e);
    console.log('--------------');
    myLine.notify(`\nDB接続失敗`);
    return;
  }
  // DBに接続して更新対象のイベントIDを取得
  const updateEventList = await common.selectDb(connection, constants.sql.select.endUpdateEventList, [getAt]);
  console.log(`イベント件数:${updateEventList.length}件`);
  // 対象イベントが0件だったら終了
  if (updateEventList.length === 0) {
    connection.end();
    return;
  }
  // イベント毎にループ
  for (let updateEvent of updateEventList) {
    const { event_id, event_url } = updateEvent;
    // イベントの参加者を取得（Web）
    const eventRes = await fetch(event_url);
    // イベント情報取得確認
    if (eventRes.status !== 200) {
      myLine.notify(`\nイベント情報取得失敗\nイベントID:${updateEventId}`);
      continue;
    }
    try {
      // イベントページから参加者を取得
      const eventHtml = await eventRes.text();
      const eventDom = new JSDOM(eventHtml);
      const eventDocument = eventDom.window.document;
      const eventNodes = eventDocument.getElementsByClassName('contentlist-link');
      const eventUserData = Array.from(eventNodes, rooms => {
        return {
          event_id: event_id,
          room_id: rooms.getElementsByClassName('js-follow-btn')[0].dataset.roomId,
          get_at: getAt,
          point: Number(rooms.getElementsByClassName('listcardinfo-sub-single-right-text')[0].textContent.replace('\n        合計ポイント: ', '').replace('pt\n      ', '')),
          now_rank: Number(rooms.getElementsByClassName('label-ranking listcard-ranking')[0].textContent.replace('\n    ', '').replace('\n      \n      \n  ', '')),
        }
      });
      let insertArry = [];
      // 更新
      for (let userData of eventUserData) {
        const { event_id, room_id, get_at, point, now_rank } = userData
        const rommRes = await fetch(`${constants.url.room.profile}${room_id}`);
        const roomResJson = await rommRes.json();
        insertArry.push([
          event_id,
          room_id,
          get_at,
          roomResJson.follower_num,
          0,
          0,
          point,
          now_rank
        ]);
      }
      await common.transactionDb(connection, constants.sql.insert.history, [insertArry]);
    } catch (e) {
      console.log('---異常終了---');
      console.log(e);
      console.log('--------------');
      myLine.notify(`\n異常終了\n${e}`);
    }
  }
  // 接続を終了
  connection.end();
  console.log('処理終了');
})();

