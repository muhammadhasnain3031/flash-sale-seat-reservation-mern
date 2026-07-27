const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Idempotency check ke liye email unique hona zaroori hai
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["held", "confirmed"],
      default: "held",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete background worker engine (TTL index)
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Reservation", reservationSchema);
