import { User } from "../models/User.js";

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
};

export const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (email && email.toLowerCase() !== user.email) {
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(409).json({ message: "Email already in use" });
    }
    user.email = email.toLowerCase();
  }

  if (name) {
    user.name = name.trim();
  }

  await user.save();
  res.json({ message: "Profile updated", user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};
