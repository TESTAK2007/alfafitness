import mongoose from "mongoose";
import { inMemoryDb } from "../data/inMemoryDb.js";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    membership: { type: String, required: true },
    price: { type: String, required: true },
    status: { type: String, default: "active" },
    startedAt: { type: Date, default: Date.now },
    renewalDate: { type: Date, required: true }
  },
  { timestamps: true }
);

const SubscriptionModel = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
const useMongo = () => mongoose.connection.readyState === 1;

export const Subscription = {
  find(query) {
    return useMongo() ? SubscriptionModel.find(query) : inMemoryDb.findSubscriptions(query);
  },
  create(data) {
    return useMongo() ? SubscriptionModel.create(data) : inMemoryDb.createSubscription(data);
  }
};
