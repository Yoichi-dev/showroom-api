const express = require('express');
const router = express.Router();
const axios = require('axios');
const axiosRetry = require('axios-retry');
const { JSDOM } = require("jsdom");
const { check, validationResult } = require('express-validator');

const constants = require('../constants');
const common = require('../common');
const validator = require('../validator');

/* ライブAPI */
router.get('/', function (req, res, next) {
  res.json({ title: 'Live API' });
});

const client = axios.create({ baseURL: constants.url.base });
axiosRetry(client, { retries: 3 });

/* SHOWROOM API */
router.post('/api', validator, common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  if (!(req.body.category in constants.url) || !(req.body.type in constants.url[req.body.category])) {
    return res.status(422).json({ errors: "no url" });
  }

  const apiRes = await client.get(constants.url[req.body.category][req.body.type] + req.body.key)
    .then(result => {
      return result.data;
    })
    .catch(error => {
      return error.response.data;
    });
  
  res.json(apiRes);
}));

/* ルーム検索 */
router.get('/search', [check('keyword').not().isEmpty()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const searchData = [];
  try {
    const searchRes = await client.get(`${constants.url.other.search}${encodeURI(req.query.keyword)}`);
    const dom = new JSDOM(searchRes.data);
    const search = dom.window.document.getElementById('room-list').getElementsByClassName('search_res_li');
    for (let i = 0; i < search.length; i++) {
      if (i < 10) {
        searchData.push(
          {
            img: search[i].getElementsByClassName('listcardinfo-image')[0].getElementsByTagName('img')[0].dataset.src,
            id: search[i].getElementsByClassName('listcardinfo-image')[0].getElementsByClassName('room-url')[0].dataset.roomId,
            url: search[i].getElementsByClassName('listcardinfo-image')[0].getElementsByTagName('a')[0].href.replace('/r/', ''),
            title: search[i].getElementsByClassName('listcardinfo-info')[0].getElementsByTagName('h4')[0].textContent
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
