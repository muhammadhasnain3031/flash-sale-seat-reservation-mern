const express = require("express");
const router = express.Router();

const controller = require("../controllers/reservation.controller");

const {
  reserveValidator,
  confirmValidator,
} = require("../validators/reservation.validator");

router.post("/reserve", reserveValidator, controller.reserveSeat);

router.post("/confirm", confirmValidator, controller.confirmSeat);

router.get("/status", controller.getStatus);

router.get("/reservations", controller.getReservation);

module.exports = router;