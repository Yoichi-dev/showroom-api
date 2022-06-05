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
const connection = mysql.createConnection(process.env.PLANETSCALE_DATABASE_URL);

// LINEトークン
myLine.setToken(env.LINE_API_KEY);

// 現在日時
const getAt = Math.floor(new Date().getTime() / 1000);

(async () => {
  console.log('処理開始');
  try {
    // DB接続
    await common.dbConnect(connection);
    // DBに接続して更新対象のイベントIDを取得
    const updateEventList = await common.selectDb(connection, constants.sql.select.updateEventList, [getAt]);
    // 対象イベントが0件だったら終了
    if (updateEventList.length === 0) throw `イベント件数:${updateEventList.length}件`;
    console.log(`イベント件数：${updateEventList.length}件`);
    // イベント毎にループ
    for (let updateEvent of updateEventList) {
      const updateEventId = updateEvent.event_id;
      const updateEventUrl = updateEvent.event_url;
      // イベントの参加者を取得（Web）
      const eventRes = await fetch(updateEventUrl);
      // イベント情報取得確認
      if (eventRes.status !== 200) {
        myLine.notify(`\nイベント情報取得失敗\nイベントID:${updateEventId}`);
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
      // イベントの参加者を取得（DB）
      const eventDbUsersObj = await common.selectDb(connection, constants.sql.select.registeredUsers, [updateEventId]);
      const eventDbUsers = Array.from(eventDbUsersObj, data => data.room_id);
      // イベントから辞退したルームを削除
      const deleteUsers = eventDbUsers.filter(i => eventUsers.indexOf(i) === -1);
      if (deleteUsers.length !== 0) {
        for (let roomId of deleteUsers) {
          await common.transactionDb(connection, constants.sql.delete.history, [updateEventId, roomId]);
        }
      }
      // イベントに途中から参加したデータを追加
      const addUsers = eventUsers.filter(i => eventDbUsers.indexOf(i) === -1);
      // イベント毎のインサートデータ
      let insertEventPoint = [];
      for (let roomId of eventUsers) {
        // ルーム情報の更新
        const rommRes = await fetch(`${constants.url.room.profile}${roomId}`);
        const roomResJson = await rommRes.json();
        await common.transactionDb(connection, constants.sql.update.roomName, [roomId, roomResJson.room_name, roomResJson.room_url_key, roomResJson.room_name, roomResJson.room_url_key]);
        // 新規参加者の足りないデータを追加
        if (addUsers.length !== 0) {
          // 現在登録されている履歴情報を取得
          const historyAtList = await common.selectDb(connection, constants.sql.select.historyAtList, [updateEventId]);
          if (addUsers.includes(String(roomId))) {
            for (let addAt of historyAtList) {
              insertEventPoint.push({
                event_id: updateEventId,
                room_id: roomId,
                get_at: addAt,
                follower_num: roomResJson.follower_num,
                gap: 0,
                next_rank: eventUsers.length - 1,
                point: 0,
                now_rank: eventUsers.length
              });
            }
          }
        }
        // TODO:新規イベント参加直後のライブがプレミアムライブだった際はデータ取得ができない
        // 現在プレミアムライブ中か
        if (roomResJson.premium_room_type === 1) {
          // 1個前のデータを取得して更新
          await common.transactionDb(connection, constants.sql.insert.lastHistoryData, [getAt, updateEventId, roomId]);
        } else {
          // ルームポイント情報取得
          const eventAndSupportRes = await fetch(`${constants.url.room.eventAndSupport}${roomId}`);
          if (eventAndSupportRes.status !== 200) {
            // 1個前のデータを取得して更新
            await common.transactionDb(connection, constants.sql.insert.lastHistoryData, [getAt, updateEventId, roomId]);
          } else {
            // データをセット
            const eventAndSupportResJson = await eventAndSupportRes.json();
            insertEventPoint.push({
              event_id: updateEventId,
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
    }
  } catch (e) {
    console.log('---異常終了---');
    console.log(e);
    console.log('--------------');
    myLine.notify(`\nイベントポイント更新処理失敗\n${e}`);
  } finally {
    // 接続切断
    connection.end();
  }
  console.log('処理終了');
})();

