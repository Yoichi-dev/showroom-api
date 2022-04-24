const express = require('express');
const router = express.Router();
const constants = require('../constants');
const common = require('../common');
const { check, validationResult } = require('express-validator');

/* ルームAPI */
router.get('/', function (req, res, next) {
  res.json({ title: 'Room API' });
});

/*  プロフィール */
router.get('/profile/:room_id', [check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const profile = await common.exeApi(`${constants.url.room.profile}${req.params.room_id}`);
  res.json(profile);
}));

/* 参加中イベント */
router.get('/event_and_support/:room_id', [check('room_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const eventAndSupport = await common.exeApi(`${constants.url.room.eventAndSupport}${req.params.room_id}`);
  res.json(eventAndSupport);
}));

module.exports = router;
