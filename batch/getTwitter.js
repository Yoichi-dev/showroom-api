'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, ".env") });
const mysql = require('mysql2');
const fetch = require('node-fetch');
const https = require('https')
const http = require('http')

const common = require('../common');

// 設定値
const constants = require('../constants');
const env = process.env;

// 接続情報
const connection = mysql.createConnection(common.mysqlSetting());

const getAt = process.argv[2];

function get_redirect_url(src_url) {
  return new Promise((resolve, reject) => {
    try {
      const client = src_url.startsWith('https') ? https : http
      client.get(src_url, (res) => {
        resolve(res.headers['location'])
      }).on('error', (err) => {
        reject(err)
      })
    } catch (err) {
      reject(err)
    }
  })
}

(async () => {
  console.log('処理開始');
  try {
    // DB接続
    await common.dbConnect(connection);
  } catch (e) {
    console.log('---異常終了---');
    console.log(e);
    console.log('--------------');
    return;
  }
  // DBに接続して更新対象のイベントIDを取得
  const updateEventList = await common.selectDb(connection, constants.sql.select.twitter, [getAt]);
  // 対象イベントが0件だったら終了
  if (updateEventList.length === 0) {
    connection.end();
    return;
  }
  console.log(`イベント件数:${updateEventList.length}件`);
  console.log("")
  console.log("")
  // イベント毎にループ
  for (let updateEvent of updateEventList) {
    const updateEventId = updateEvent.event_id;
    console.log(`【イベント追加】`)
    console.log(updateEvent.event_name)
    console.log("")
    console.log(`https://point-history.showroom-app.com/event/${updateEventId}`)
    console.log("")
    // イベントの参加者を取得（DB）
    const eventDbUsersObj = await common.selectDb(connection, constants.sql.select.registeredUsers, [updateEventId]);
    const eventDbUsers = Array.from(eventDbUsersObj, data => data.room_id);
    for (let roomId of eventDbUsers) {
      // ルーム情報の更新
      let roomResJson = null;
      try {
        const rommRes = await fetch(`${constants.url.base}${constants.url.room.profile}${roomId}`);
        roomResJson = await rommRes.json();
        if (roomResJson.sns_list) {
          if (roomResJson.sns_list[0].name === 'Twitter') {
            const redirect_url = await get_redirect_url(roomResJson.sns_list[0].url)
              .catch(err => {
                console.log(err)
              })
            if (redirect_url) {
              console.log(redirect_url.replace('https://twitter.com/', '@'))
            }
          } else {
            console.log(`https://www.showroom-live.com/room/profile?room_id=${roomId}`)
          }

        } else {
          console.log(`https://www.showroom-live.com/room/profile?room_id=${roomId}`)
        }
      } catch (e) {
        console.log('---異常終了---');
        console.log(e);
        console.log('--------------');
      }
    }
    console.log("")
    console.log("")
  }
  // 接続を終了
  connection.end();
  console.log('処理終了');
})();
