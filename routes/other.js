const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");
const router = express.Router();
const constants = require('../constants');
const common = require('../common');
const { check, validationResult } = require('express-validator');

/* 他API */
router.get('/', function (req, res, next) {
  res.json({ title: 'Other API' });
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

module.exports = router;
