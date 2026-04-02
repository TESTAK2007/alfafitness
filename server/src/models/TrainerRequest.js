import mongoose from "mongoose";
import { inMemoryDb } from "../data/inMemoryDb.js";

const trainerRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trainerId: { type: String, required: true },
    trainerName: { type: String, required: true },
    goal: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
    preferredTime: { type: String, default: "Flexible" },
    status: { type: String, default: "pending" }
  },
  { timestamps: true }
);

const TrainerRequestModel = mongoose.models.TrainerRequest || mongoose.model("TrainerRequest", trainerRequestSchema);
const useMongo = () => mongoose.connection.readyState === 1;

export const TrainerRequest = {
  find(query) {
    return useMongo() ? TrainerRequestModel.find(query) : inMemoryDb.findTrainerRequests(query);
  },
  create(data) {
    return useMongo() ? TrainerRequestModel.create(data) : inMemoryDb.createTrainerRequest(data);
  }
};
