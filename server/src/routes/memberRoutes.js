import express from "express";
import { authMiddleware } from "../middleware/secureAuth.js";
import { memberships, schedule, trainers } from "../data/contentData.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
import { Subscription } from "../models/Subscription.js";
import { TrainerRequest } from "../models/TrainerRequest.js";

const router = express.Router();

const membershipCatalog = {
  starter: { title: "НАЧИНАЮЩИЙ", price: "$29.99" },
  pro: { title: "ПРО", price: "$59.99" },
  elite: { title: "ЭЛИТНЫЙ", price: "$99.99" }
};

router.use(authMiddleware);

router.get("/dashboard", async (req, res) => {
  try {
    const [user, bookings, subscriptions, trainerRequests] = await Promise.all([
      User.findById(req.user.id).select("-password"),
      Booking.find({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      Subscription.find({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      TrainerRequest.find({ user: req.user.id }).sort({ createdAt: -1 }).lean()
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      profile: user,
      bookings,
      subscriptions,
      trainerRequests,
      recommendedClasses: schedule.slice(0, 3),
      featuredTrainer: trainers[0]
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load dashboard", error: error.message });
  }
});

router.post("/bookings", async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const selectedClass = schedule.find((item) => item.id === scheduleId);

    if (!selectedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const existingBooking = await Booking.findOne({ user: req.user.id, scheduleId });
    if (existingBooking) {
      return res.status(409).json({ message: "Class already booked" });
    }

    const booking = await Booking.create({
      user: req.user.id,
      scheduleId,
      className: selectedClass.className,
      trainer: selectedClass.trainer,
      day: selectedClass.day,
      time: selectedClass.time,
      level: selectedClass.level
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Booking failed", error: error.message });
  }
});

router.post("/subscriptions", async (req, res) => {
  try {
    const { membershipId } = req.body;
    const selectedPlan = memberships.find((plan) => plan.id === membershipId);
    const premiumPlan = membershipCatalog[membershipId];

    if (!selectedPlan || !premiumPlan) {
      return res.status(404).json({ message: "Membership not found" });
    }

    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    const subscription = await Subscription.create({
      user: req.user.id,
      membership: selectedPlan.id,
      price: premiumPlan.price,
      renewalDate
    });

    await User.findByIdAndUpdate(req.user.id, {
      membership: selectedPlan.id,
      subscriptionStatus: "active"
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: "Subscription failed", error: error.message });
  }
});

router.post("/trainer-requests", async (req, res) => {
  try {
    const { trainerId, goal, notes, preferredTime } = req.body;
    const trainer = trainers.find((item) => item.id === trainerId);

    if (!trainer || !goal) {
      return res.status(400).json({ message: "Trainer and goal are required" });
    }

    const trainerRequest = await TrainerRequest.create({
      user: req.user.id,
      trainerId,
      trainerName: trainer.name,
      goal,
      notes,
      preferredTime
    });

    res.status(201).json(trainerRequest);
  } catch (error) {
    res.status(500).json({ message: "Trainer request failed", error: error.message });
  }
});

export default router;
