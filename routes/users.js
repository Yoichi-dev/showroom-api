const express = require('express');
const router = express.Router();
const constants = require('../constants');
const common = require('../common');
const { check, validationResult } = require('express-validator');

/* ユーザAPI */
router.get('/', function (req, res, next) {
  res.json({ title: 'Users API' });
});

/*  プロフィール */
router.get('/profile/:user_id', [check('user_id').not().isEmpty().isNumeric()], common.asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const profile = await common.exeApi(`${constants.url.user.profile}${req.params.user_id}`);
  res.json(profile);
}));

module.exports = router;
