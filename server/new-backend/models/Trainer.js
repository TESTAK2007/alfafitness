import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  day: { type: String, required: true },
  slots: [{ type: String, required: true }]
}, { _id: false });

const trainerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  specialization: { type: String, required: true, trim: true },
  availability: { type: [availabilitySchema], default: [] }
}, { timestamps: true });

export const Trainer = mongoose.models.Trainer || mongoose.model("Trainer", trainerSchema);
