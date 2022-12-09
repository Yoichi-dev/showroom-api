const { check } = require('express-validator');

module.exports = [
  check('category').not().isEmpty().withMessage('必須項目'),
  check('type').not().isEmpty().withMessage('必須項目'),
  check('key').not().isEmpty().withMessage('必須項目'),
];