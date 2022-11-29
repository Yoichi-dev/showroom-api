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

(async () => {
  console.log('処理開始');

  let date = new Date();
  let startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), "00", "00");
  let startUnixDate = Math.round(startDate.getTime() / 1000);

  const getAt = startUnixDate;

  try {
    // DB接続
    await common.dbConnect(connection);
    // DBに接続して登録予定のイベントリストを取得
    const planEventList = await common.selectDb(connection, constants.sql.select.scheduledEvents, [getAt]);
    // イベントリストが0件だったら終了
    if (planEventList.length === 0) return;
    console.log(`イベント件数:${planEventList.length}件`);
    // イベント毎にループ
    for (let planEventUrlObj of planEventList) {
      const planEventUrl = planEventUrlObj.event_url;
      // イベントの参加者を取得（Web）
      const eventRes = await fetch(`${constants.url.event}${planEventUrl}`);
      // イベント情報取得確認
      if (eventRes.status !== 200) {
        myLine.notify(`\nイベント情報取得失敗\nイベントURL:${planEventUrl}`);
        continue;
      }
      // イベントページから参加者を取得
      const eventHtml = await eventRes.text();
      const eventDom = new JSDOM(eventHtml);
      const eventDocument = eventDom.window.document;
      const eventNodes = eventDocument.getElementsByClassName('js-follow-btn');
      const eventUsers = Array.from(eventNodes, rooms => rooms.dataset.roomId);
      // イベントに参加しているユーザが居なければスキップ
      if (eventUsers.length === 0) {
        continue;
      }
      // イベント毎のインサートデータ
      let insertEventPoint = [];
      // イベント情報登録フラグ
      let eventIndoFLg = false;
      let eventId = null;
      for (let roomId of eventUsers) {
        // ルーム情報の更新
        const rommRes = await fetch(`${constants.url.room.profile}${roomId}`);
        const roomResJson = await rommRes.json();
        await common.transactionDb(connection, constants.sql.update.roomName, [roomId, roomResJson.room_name, roomResJson.room_url_key, roomResJson.room_name, roomResJson.room_url_key]);
        // イベント情報登録
        if (!eventIndoFLg) {
          if (roomResJson.premium_room_type === 0) {
            // ルームポイント情報からイベント情報取得
            const eventAndSupportRes = await fetch(`${constants.url.room.eventAndSupport}${roomId}`);
            const eventAndSupportResJson = await eventAndSupportRes.json();
            if (planEventUrl === eventAndSupportResJson.event.event_url.replace(constants.url.event, '')) {
              const eventIndoData = {
                event_id: eventAndSupportResJson.event.event_id,
                event_name: eventAndSupportResJson.event.event_name,
                event_url: eventAndSupportResJson.event.event_url,
                image: eventAndSupportResJson.event.image,
                started_at: eventAndSupportResJson.event.started_at,
                ended_at: eventAndSupportResJson.event.ended_at
              };
              await common.transactionDb(connection, constants.sql.insert.eventInfo, eventIndoData);
              eventId = eventAndSupportResJson.event.event_id;
              eventIndoFLg = true;
            }
          }
        }
        // データをセット
        insertEventPoint.push({
          event_id: eventId,
          room_id: roomId,
          get_at: getAt,
          follower_num: roomResJson.follower_num,
          gap: 0,
          next_rank: 0,
          point: 0,
          now_rank: 1
        });
      }
      if (eventId === null) {
        myLine.notify(`\nイベントID取得失敗\nイベントURL:${planEventUrl}`);
        continue;
      }
      // インサート出来る形式に変換
      let insertArry = [];
      for (let insertData of insertEventPoint) {
        insertArry.push([
          eventId,
          insertData.room_id,
          insertData.get_at,
          insertData.follower_num,
          insertData.gap,
          insertData.next_rank,
          insertData.point,
          insertData.now_rank
        ]);
      }
      // インサート
      await common.transactionDb(connection, constants.sql.insert.history, [insertArry]);
    }
    // 登録予定のイベントリストを削除
    await common.transactionDb(connection, constants.sql.delete.scheduledEvents, [getAt]);
  } catch (e) {
    console.log('---異常終了---');
    console.log(e);
    console.log('--------------');
    myLine.notify(`\nイベント予定登録処理失敗\n${e}`);
  } finally {
    // 接続切断
    connection.end();
  }
  console.log('処理終了');
})();

