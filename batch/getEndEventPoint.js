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

  // DB接続
  try {
    await common.dbConnect(connection);
  } catch (e) {
    console.log('---異常終了---');
    console.log(e);
    console.log('--------------');
    myLine.notify(`\nDB接続失敗`);
    return;
  }
  // DBに接続して登録予定のイベントリストを取得
  const endEventList = await common.selectDb(connection, constants.sql.select.endUpdateEventList, [getAt]);
  // イベントリストが0件だったら終了
  if (endEventList.length === 0) {
    connection.end();
    console.log('処理終了');
    return;
  }
  console.log(`イベント件数:${endEventList.length}件`);
  // イベント毎にループ
  for (let endEventObj of endEventList) {
    const endEventId = endEventObj.event_id;
    const endEventUrl = endEventObj.event_url;
    console.log(`イベントID:${endEventId}`)
    console.log(`イベントURL:${endEventUrl}`)
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
    // 成功フラグ
    let successFlg = true;
    for (let roomId of eventUsers) {
      console.log(`-> ${roomId}`)
      // ルーム情報の更新
      let roomResJson = null;
      try {
        const rommRes = await fetch(`${constants.url.room.profile}${roomId}`);
        roomResJson = await rommRes.json();
        await common.transactionDb(connection, constants.sql.update.roomName, [roomId, roomResJson.room_name, roomResJson.room_url_key, roomResJson.room_name, roomResJson.room_url_key]);
      } catch (e) {
        console.log('---異常終了---');
        console.log(e);
        console.log('--------------');
        myLine.notify(`\n${roomId}のルーム情報取得・更新に失敗`);
        successFlg = false;
      }
      try {
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
            if (eventAndSupportResJson.event === null) {
              console.log(`  -> ${roomId}はイベントに参加していません`)
              myLine.notify(`\nイベントポイント更新処理\nevent_and_supportでnull:${roomId}`);
            } else {
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
      } catch (e) {
        console.log('---異常終了---');
        console.log(e);
        console.log('--------------');
        myLine.notify(`\n${roomId}の情報取得に失敗\neventid:${updateEventId}\ntime:${getAt}`);
        successFlg = false;
      }
    }
    if (successFlg) {
      // インサート出来る形式に変換
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
    } else {
      myLine.notify(`\nイベント情報取得失敗\n登録失敗\nイベントID:${updateEventId}`);
    }
  }
  // 接続を終了
  connection.end();
  console.log('処理終了');
})();

