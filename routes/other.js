const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");
const router = express.Router();
const constants = require('../constants');
const common = require('../common');
const { check, validationResult } = require('express-validator');

let logIp = [];

/* 他API */
router.get('/', function (req, res, next) {
  res.json({ title: 'Other API' });
});

/* 初期化検知 */
router.get('/delete', function (req, res, next) {
  // IP取得
  const ip = getIP(req);
  if (ip !== '0.0.0.0') {
    if (logIp.some((e) => e.accessIp === ip)) {
      logIp.forEach(elm => {
        if (elm.accessIp === ip) {
          elm.count++;
        }
      });
    } else {
      logIp.push({
        accessIp: ip,
        count: 1
      });
    }
  }
  console.log(logIp)
  res.json({ title: 'delete' });
});

/* ブロードキャストキー取得 */
router.get('/broadcast/:room_url_key', [check('room_url_key').not().isEmpty()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const roomStatusJson = await common.exeApi(`${constants.url.room.status}${req.params.room_url_key}`);
  res.json(roomStatusJson === null ? {} : roomStatusJson.broadcast_key);
}));

/* ルーム検索 */
router.get('/search', [check('keyword').not().isEmpty()], common.asyncWrapper(async (req, res, next) => {
  // 初期化制限
  const ip = getIP(req);
  for (let i = 0; i < logIp.length; i++) {
    if (logIp[i].accessIp === ip && logIp[i].count > 2) {
      return res.status(401).json({ errors: '初期化回数制限に達しました' });
    }
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  let searchData = [];
  try {
    const searchRes = await fetch(`${constants.url.search}${encodeURI(req.query.keyword)}`);
    const searchResHtml = await searchRes.text();
    const dom = new JSDOM(searchResHtml);
    const search = dom.window.document.getElementById('room-list').getElementsByClassName('search_res_li');
    for (let i = 0; i < search.length; i++) {
      if (i < 10) {
        // ルーム画像を取得
        let roomData = await common.exeApi(`${constants.url.room.profile}${search[i].getElementsByClassName('listcardinfo-image')[0].getElementsByClassName('room-url')[0].dataset.roomId}`);
        searchData.push(
          {
            img: roomData.image,
            id: search[i].getElementsByClassName('listcardinfo-image')[0].getElementsByClassName('room-url')[0].dataset.roomId,
            url: search[i].getElementsByClassName('listcardinfo-image')[0].getElementsByClassName('room-url')[0].href,
            title: search[i].getElementsByClassName('listcardinfo-main-text')[0].textContent
          }
        )
      }
    }
    res.json(searchData);
  } catch (error) {
    console.log(error);
    res.json(searchData);
  }
}));

/* イベント一覧取得 */
router.get('/event', [], common.asyncWrapper(async (req, res, next) => {
  let eventList = [];
  try {
    const eventRes = await fetch(constants.url.eventList);
    const eventResHtml = await eventRes.text();
    const dom = new JSDOM(eventResHtml);
    const events = dom.window.document.getElementById("js-more-section-soon").getElementsByTagName("li");

    for (let data of events) {
      eventList.push({
        url: data.getElementsByTagName("a")[0].href.replace('/event/', ''),
        img: data.getElementsByTagName('img')[0].src,
        date: new Date(data.getElementsByClassName("tx-renew-date")[0].textContent.split('\n')[3].replace('      ', '').split(' - ')[0])
      })
    }

    eventList.sort((a, b) => {
      if (a.date > b.date) return 1
      if (a.date < b.date) return -1
      return 0
    })

    res.json(eventList);
  } catch (error) {
    console.log(error);
    res.json(eventList);
  }
}));

function getIP(req) {
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'];
  }
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }
  if (req.connection.socket && req.connection.socket.remoteAddress) {
    return req.connection.socket.remoteAddress;
  }
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  return '0.0.0.0';
};

module.exports = router;
