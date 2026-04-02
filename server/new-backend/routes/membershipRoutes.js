import express from "express";
import { getMemberships, purchaseMembership } from "../controllers/membershipController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getMemberships);
router.post("/purchase", authenticate, purchaseMembership);

export default router;
