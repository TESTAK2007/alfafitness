import mongoose from "mongoose";
import { inMemoryDb } from "../data/inMemoryDb.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    membership: { type: String, default: "starter" },
    role: { type: String, default: "member" },
    goal: { type: String, default: "Build strength and discipline" },
    avatar: { type: String, default: "" },
    joinedAt: { type: Date, default: Date.now },
    subscriptionStatus: { type: String, default: "inactive" },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
const useMongo = () => mongoose.connection.readyState === 1;

export const User = {
  findOne(query) {
    return useMongo() ? UserModel.findOne(query) : inMemoryDb.findUserOne(query);
  },
  create(data) {
    return useMongo() ? UserModel.create(data) : inMemoryDb.createUser(data);
  },
  findById(id) {
    return useMongo() ? UserModel.findById(id) : inMemoryDb.findUserById(id);
  },
  findByIdAndUpdate(id, update) {
    return useMongo() ? UserModel.findByIdAndUpdate(id, update) : inMemoryDb.updateUserById(id, update);
  }
};
