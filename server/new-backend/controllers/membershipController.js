import { Membership } from "../models/Membership.js";

export const getMemberships = async (_req, res) => {
  const memberships = await Membership.find();
  res.json(memberships);
};

export const purchaseMembership = async (req, res) => {
  const { membershipId } = req.body;

  if (!membershipId) {
    return res.status(400).json({ message: "membershipId is required" });
  }

  const membership = await Membership.findById(membershipId);
  if (!membership) {
    return res.status(404).json({ message: "Membership not found" });
  }

  res.status(201).json({ message: "Membership purchased", membership });
};
