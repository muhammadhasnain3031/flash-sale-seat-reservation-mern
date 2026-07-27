const Reservation = require("../models/Reservation");
const mongoose = require("mongoose");

const TOTAL_SEATS_LIMIT = 30;

// Helper: hold abhi bhi valid hai ya nahi (confirmed hamesha active, held sirf expiry se pehle)
const isActive = (r) =>
  r.status === "confirmed" || (r.status === "held" && r.expiresAt > new Date());

class ReservationService {

  // 1. POST /api/reserve
  async reserve(email) {
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes hold window
    const normalizedEmail = email.trim().toLowerCase();

    const session = await mongoose.startSession();
    try {
      let resultHold;

      await session.withTransaction(async () => {
        const existing = await Reservation.findOne({ email: normalizedEmail }).session(session);

        if (existing && isActive(existing)) {
          resultHold = { isNew: false, holdId: existing._id, expiresAt: existing.expiresAt };
          return;
        }

        if (existing && !isActive(existing)) {
          await Reservation.deleteOne({ _id: existing._id }).session(session);
        }

        const currentActiveCount = await Reservation.countDocuments(
          {
            $or: [
              { status: "confirmed" },
              { status: "held", expiresAt: { $gt: new Date() } },
            ],
          },
          { session }
        );

        if (currentActiveCount >= TOTAL_SEATS_LIMIT) {
          const error = new Error("Sold out! All 30 seats are allocated.");
          error.statusCode = 400;
          throw error;
        }

        const [newHold] = await Reservation.create(
          [{ email: normalizedEmail, expiresAt, status: "held" }],
          { session }
        );

        resultHold = { isNew: true, holdId: newHold._id, expiresAt: newHold.expiresAt };
      });

      session.endSession();
      return resultHold;

    } catch (error) {
      session.endSession();

      if (error.code === 11000) {
        let fallbackExisting = null;
        for (let i = 0; i < 5 && !fallbackExisting; i++) {
          fallbackExisting = await Reservation.findOne({ email: normalizedEmail });
          if (!fallbackExisting) await new Promise((r) => setTimeout(r, 100));
        }

        if (!fallbackExisting) {
          const err = new Error("Reservation conflict, please try again.");
          err.statusCode = 409;
          throw err;
        }

        return {
          isNew: false,
          holdId: fallbackExisting._id,
          expiresAt: fallbackExisting.expiresAt,
        };
      }
      throw error;
    }
  } // ← YE MISSING BRACE THA (reserve() method close karta hai)

  // 2. POST /api/confirm
  async confirm(holdId) {
    if (!mongoose.Types.ObjectId.isValid(holdId)) {
      const error = new Error("Invalid holdId format.");
      error.statusCode = 400;
      throw error;
    }

    const reservation = await Reservation.findById(holdId);

    if (!reservation) {
      const error = new Error("Confirming an expired hold failed.");
      error.statusCode = 400;
      throw error;
    }

    if (reservation.status === "confirmed") {
      return { success: true, message: "Seat already confirmed.", holdId: reservation._id };
    }

    if (reservation.status === "held" && reservation.expiresAt < new Date()) {
      const error = new Error("Confirming an expired hold failed.");
      error.statusCode = 400;
      throw error;
    }

    reservation.status = "confirmed";
    reservation.expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
    await reservation.save();

    return { success: true, message: "Seat successfully confirmed!", holdId: reservation._id };
  }

  // 3. GET /api/status
  async status() {
    const confirmed = await Reservation.countDocuments({ status: "confirmed" });
    const held = await Reservation.countDocuments({
      status: "held",
      expiresAt: { $gt: new Date() },
    });
    const available = TOTAL_SEATS_LIMIT - (confirmed + held);

    return {
      totalSeats: TOTAL_SEATS_LIMIT,
      confirmed,
      held,
      available: available >= 0 ? available : 0,
    };
  }

  // 4. GET /api/reservations?email=...
  async getReservation(email) {
    if (!email) {
      const error = new Error("Email parameter is required.");
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const data = await Reservation.findOne({ email: normalizedEmail });

    if (!data) {
      const error = new Error("No current reservation or hold found for this email.");
      error.statusCode = 404;
      throw error;
    }
    return data;
  }
}

module.exports = new ReservationService();