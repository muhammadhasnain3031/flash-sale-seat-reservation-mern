const { body } = require("express-validator");

exports.reserveValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),
];

exports.confirmValidator = [
  body("holdId")
    .notEmpty()
    .withMessage("holdId is required"),
];