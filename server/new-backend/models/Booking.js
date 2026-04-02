import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
  date: { type: Date, required: true }
}, { timestamps: true });

export const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
