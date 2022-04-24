require('dotenv').config();
const express = require('express');
const router = express.Router();
const constants = require('../constants');
const common = require('../common');
const Line = require('../notification');
const pinger = require('minecraft-pinger')
const { check, validationResult } = require('express-validator');

const myLine = new Line();
const ENV = process.env;

/* マインクラフトAPI */
router.get('/', function (req, res, next) {
  res.json({ title: 'Minecraft API' });
});

/* 疎通 */
router.get('/ping', common.asyncWrapper(async (req, res, next) => {
  pinger.ping(constants.minecraft.url, constants.minecraft.port, (error, result) => {
    error ? res.status(500).json({}) : res.json(result);
  })
}));

/* 登録 */
router.get('/register/:mcid/:twitter', [check('mcid').not().isEmpty(), check('twitter').not().isEmpty()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const mcidRes = await common.exeApi(`${constants.minecraft}${req.params.mcid}`);
    if (mcidRes != null) {
      myLine.setToken(ENV.LINE_API_KEY);
      myLine.notify(`\nMinecraft Server新規利用申請\nID : ${mcidRes.name}\nTwitter : ${req.params.twitter}`);
    }
    res.json(mcidRes);
  } catch {
    res.status(404).json({ error: 'UserID Not Found' })
  }
}));

module.exports = router;
