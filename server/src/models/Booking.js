import mongoose from "mongoose";
import { inMemoryDb } from "../data/inMemoryDb.js";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scheduleId: { type: String, required: true },
    className: { type: String, required: true },
    trainer: { type: String, required: true },
    day: { type: String, required: true },
    time: { type: String, required: true },
    level: { type: String, required: true },
    status: { type: String, default: "confirmed" }
  },
  { timestamps: true }
);

const BookingModel = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
const useMongo = () => mongoose.connection.readyState === 1;

export const Booking = {
  find(query) {
    return useMongo() ? BookingModel.find(query) : inMemoryDb.findBookings(query);
  },
  findOne(query) {
    return useMongo() ? BookingModel.findOne(query) : inMemoryDb.findBookingOne(query);
  },
  create(data) {
    return useMongo() ? BookingModel.create(data) : inMemoryDb.createBooking(data);
  }
};
