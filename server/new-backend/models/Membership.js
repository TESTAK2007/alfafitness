import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  type: { type: String, required: true, trim: true },
  price: { type: String, required: true, trim: true },
  duration: { type: String, required: true, trim: true }
}, { timestamps: true });

export const Membership = mongoose.models.Membership || mongoose.model("Membership", membershipSchema);
