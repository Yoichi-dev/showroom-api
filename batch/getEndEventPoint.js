'use strict';

require('dotenv').config();
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
  let endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), "59", "59");
  let endUnixDate = Math.round(endDate.getTime() / 1000);

  const getAt = endUnixDate;

  try {
    // DB接続
    await common.dbConnect(connection);
    // DBに接続して登録予定のイベントリストを取得
    const endEventList = await common.selectDb(connection, constants.sql.select.endEventList, [getAt]);
    // イベントリストが0件だったら終了
    if (endEventList.length === 0) return;
    console.log(`イベント件数:${endEventList.length}件`);
    // イベント毎にループ
    for (let endEventObj of endEventList) {
      const endEventId = endEventObj.event_id;
      const endEventUrl = endEventObj.event_url;
      // イベントの参加者を取得（Web）
      const eventRes = await fetch(endEventUrl);
      // イベント情報取得確認
      if (eventRes.status !== 200) {
        myLine.notify(`\n終了イベント情報取得失敗\nイベントURL:${endEventUrl}`);
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
      for (let roomId of eventUsers) {
        // ルーム情報の更新
        const rommRes = await fetch(`${constants.url.room.profile}${roomId}`);
        const roomResJson = await rommRes.json();
        await common.transactionDb(connection, constants.sql.update.roomName, [roomId, roomResJson.room_name, roomResJson.room_url_key, roomResJson.room_name, roomResJson.room_url_key]);
        // 現在プレミアムライブ中か
        if (roomResJson.premium_room_type === 1) {
          // 1個前のデータを取得して更新
          await common.transactionDb(connection, constants.sql.insert.lastHistoryData, [getAt, endEventId, roomId]);
        } else {
          // ルームポイント情報取得
          const eventAndSupportRes = await fetch(`${constants.url.room.eventAndSupport}${roomId}`);
          if (eventAndSupportRes.status !== 200) {
            // 1個前のデータを取得して更新
            await common.transactionDb(connection, constants.sql.insert.lastHistoryData, [getAt, endEventId, roomId]);
          } else {
            // データをセット
            const eventAndSupportResJson = await eventAndSupportRes.json();
            insertEventPoint.push({
              event_id: endEventId,
              room_id: roomId,
              get_at: getAt,
              follower_num: roomResJson.follower_num,
              gap: eventAndSupportResJson.event.ranking.gap,
              next_rank: eventAndSupportResJson.event.ranking.next_rank,
              point: eventAndSupportResJson.event.ranking.point,
              now_rank: eventAndSupportResJson.event.ranking.rank
            });
          }
        }
      }
      let insertArry = [];
      for (let insertData of insertEventPoint) {
        insertArry.push([
          insertData.event_id,
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

