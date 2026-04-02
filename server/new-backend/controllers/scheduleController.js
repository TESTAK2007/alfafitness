import { Booking } from "../models/Booking.js";
import { Trainer } from "../models/Trainer.js";

export const getSchedule = async (_req, res) => {
  const trainers = await Trainer.find();
  const schedule = trainers.map((trainer) => ({
    trainerId: trainer._id,
    trainerName: trainer.name,
    specialization: trainer.specialization,
    availability: trainer.availability
  }));
  res.json(schedule);
};

export const bookSession = async (req, res) => {
  const { trainerId, date } = req.body;

  if (!trainerId || !date) {
    return res.status(400).json({ message: "Trainer ID and date are required" });
  }

  const booking = await Booking.create({ userId: req.user.id, trainerId, date: new Date(date) });
  res.status(201).json({ message: "Session booked", booking });
};
