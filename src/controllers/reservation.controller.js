const { validationResult } = require("express-validator");

const reservationService = require("../services/reservation.service");

exports.reserveSeat = async (req, res, next) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });

    }

    const data = await reservationService.reserve(req.body.email);

    res.status(200).json(data);

  } catch (err) {

    next(err);

  }
};

exports.confirmSeat = async (req, res, next) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });

    }

    const data = await reservationService.confirm(req.body.holdId);

    res.json(data);

  } catch (err) {

    next(err);

  }

};

exports.getStatus = async (req, res, next) => {

  try {

    const data = await reservationService.status();

    res.json(data);

  } catch (err) {

    next(err);

  }

};

exports.getReservation = async (req, res, next) => {

  try {

    const data = await reservationService.getReservation(req.query.email);

    res.json(data);

  } catch (err) {

    next(err);

  }

};