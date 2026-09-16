import bcrypt from "bcrypt";
import User from "../models/User.js";

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || "admin@swifty.com").toLowerCase().trim();
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) return;

  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    name: process.env.ADMIN_NAME || "Swifty Admin",
    email,
    passwordHash,
    role: "admin",
    department: "Operations",
    isActive: true,
  });

  console.log(`Default admin account created: ${email}`);
};

export default seedAdmin;
