const express = require('express');
const router = express.Router();
const constants = require('../constants');
const common = require('../common');
const { check, validationResult } = require('express-validator');

/* ライブAPI */
router.get('/', function (req, res, next) {
  res.json({ title: 'Live API' });
});

/* オンライブ */
router.get('/onlives', common.asyncWrapper(async (req, res, next) => {
  const onliveList = await common.exeApi(`${constants.url.live.onlives}`);
  res.json(onliveList);
}));

/* プレミアムライブ */
router.get('/premium', common.asyncWrapper(async (req, res, next) => {
  const onliveList = await common.exeApi(`${constants.url.live.onlives}`);
  const premiumList = []
  for (let i = 0; i < onliveList.onlives.length; i++) {
    let check = onliveList.onlives[i].lives.find(
      (e) => e.premium_room_type === 1
    )
    if (check !== undefined) {
      premiumList.push(check)
    }
  }
  res.json(premiumList);
}));

/* ギフトリスト */
router.get('/gift_list/:room_id', [check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const giftList = await common.exeApi(`${constants.url.live.giftList}${req.params.room_id}`);
  res.json(giftList);
}));

/* ステージユーザリスト */
router.get('/stage_user_list/:room_id', [check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const stageUserList = await common.exeApi(`${constants.url.live.stageUserList}${req.params.room_id}`);
  res.json(stageUserList);
}));

/* ライブ情報 */
router.get('/live_info/:room_id', [check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const liveInfo = await common.exeApi(`${constants.url.live.liveInfo}${req.params.room_id}`);
  res.json(liveInfo);
}));

/* コメントログ */
router.get('/comment_log/:room_id', [check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const commentLog = await common.exeApi(`${constants.url.live.commentLog}${req.params.room_id}`);
  res.json(commentLog);
}));

/* ギフトログ */
router.get('/gift_log/:room_id', [check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const giftLog = await common.exeApi(`${constants.url.live.giftLog}${req.params.room_id}`);
  res.json(giftLog);
}));

module.exports = router;
