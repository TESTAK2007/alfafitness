import express from "express";
import { dashboardStats, memberships, schedule, testimonials, trainers } from "../data/contentData.js";

const router = express.Router();

router.get("/content", (req, res) => {
  res.json({
    club: {
      name: "ALFAFitness",
      address: "58B Kabanbay Batyr Avenue, Astana",
      phone: "+1 (415) 555-0147",
      hours: "Ежедневно: 06:00 - 23:00",
      heroHeadline: "Раскрой свою альфу.",
      heroSubtitle: "Премиум-тренировки по боксу, карате и силе в клубе с кинематографичным уровнем и подходом как у топ-стартапа.",
      tagline: "Переосмысли свои пределы."
    },
    memberships,
    schedule,
    trainers,
    testimonials,
    dashboardStats,
    directions: ["Бокс", "Карате", "Силовая лаборатория", "Зона восстановления", "Персональное обучение", "Питание спортсмена"]
  });
});

export default router;
