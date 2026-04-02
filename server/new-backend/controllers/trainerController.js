import { Trainer } from "../models/Trainer.js";

export const getTrainers = async (_req, res) => {
  const trainers = await Trainer.find();
  res.json(trainers);
};

export const getTrainerById = async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);
  if (!trainer) {
    return res.status(404).json({ message: "Trainer not found" });
  }
  res.json(trainer);
};
