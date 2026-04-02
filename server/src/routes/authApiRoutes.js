import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/secureAuth.js";

const router = express.Router();

const createToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });

const createMailTransport = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

const buildResetEmail = (name, resetLink) => {
  const greetingName = name ? `, ${name}` : "";

  return {
    subject: "ALFAFitness - Password Reset",
    text: `Vas privetstvuet ALFAFitness${greetingName}.

My poluchili zapros na sbros parolya dlya vashego akkaunta.
Esli eto byli vy, pereydite po ssylke nizhe i ustanovite novyy parol:

${resetLink}

Ssylka aktivna 30 minut.
Esli vy ne zaprashivali sbros, prosto proignoriruyte eto soobshchenie.

S uvazheniem,
Komanda ALFAFitness`,
    html: `
      <div style="background:#0b0b0b;padding:32px;font-family:Arial,sans-serif;color:#ffffff;">
        <div style="max-width:620px;margin:0 auto;background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.04em;margin-bottom:18px;">
            <span style="color:#ffffff;">ALFA</span><span style="color:#ff3b3b;">Fitness</span>
          </div>
          <p style="color:#ffffff;font-size:16px;line-height:1.7;margin:0 0 14px;">Vas privetstvuet ALFAFitness${greetingName}.</p>
          <p style="color:#aaaaaa;font-size:15px;line-height:1.8;margin:0 0 14px;">
            My poluchili zapros na sbros parolya dlya vashego akkaunta. Esli eto byli vy, nazhmite na knopku nizhe i ustanovite novyy parol.
          </p>
          <div style="margin:28px 0;">
            <a href="${resetLink}" style="display:inline-block;background:#ff3b3b;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">
              Reset Password
            </a>
          </div>
          <p style="color:#aaaaaa;font-size:14px;line-height:1.8;margin:0 0 12px;">Ssylka aktivna 30 minut.</p>
          <p style="color:#aaaaaa;font-size:14px;line-height:1.8;margin:0 0 12px;">
            Esli knopka ne otkrylas, ispolzuyte etu ssylku:
          </p>
          <p style="word-break:break-all;color:#ffffff;font-size:14px;line-height:1.8;margin:0 0 18px;">${resetLink}</p>
          <p style="color:#777777;font-size:13px;line-height:1.8;margin:0;">
            Esli vy ne zaprashivali sbros parolya, prosto proignoriruyte eto soobshchenie.
          </p>
        </div>
      </div>
    `
  };
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, membership, goal } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "This email is already registered. Please login instead." });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      phone,
      membership,
      goal,
      subscriptionStatus: membership ? "active" : "inactive"
    });

    res.status(201).json({
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        membership: user.membership,
        goal: user.goal,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.trim();
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await bcrypt.compare(normalizedPassword, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password. Check your details or reset the password." });
    }

    res.json({
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        membership: user.membership,
        goal: user.goal,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({
        message: "If this email exists, reset instructions were prepared."
      });
    }

    const resetToken = crypto.randomBytes(24).toString("hex");
    const resetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiresAt: resetExpiresAt
    });

    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
    const emailContent = buildResetEmail(user.name, resetLink);

    await createMailTransport().sendMail({
      from: `"ALFAFitness" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    res.json({
      message: "Password reset email sent."
    });
  } catch (error) {
    console.error("Password reset request failed:", error);
    res.status(500).json({ message: "Password reset request failed", error: error.message });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({ resetPasswordToken: token });

    if (!user || !user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "Reset link is invalid or expired" });
    }

    await User.findByIdAndUpdate(user._id, {
      password: await bcrypt.hash(password, 10),
      resetPasswordToken: null,
      resetPasswordExpiresAt: null
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed", error: error.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Profile fetch failed", error: error.message });
  }
});

export default router;
