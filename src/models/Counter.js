const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      unique: true,
      required: true,
    },

    totalSeats: {
      type: Number,
      default: 30,
    },

    reservedSeats: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Counter", counterSchema);