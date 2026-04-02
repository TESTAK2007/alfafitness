import express from "express";
import { getSchedule, bookSession } from "../controllers/scheduleController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getSchedule);
router.post("/book", authenticate, bookSession);

export default router;
