import bcrypt from "bcrypt";
import User from "../models/User.js";

const seedAdmin = async () => {
  const existingAdmin = await User.findOne({
    role: "admin",
  });

  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(
    "Admin@12345",
    12
  );

  await User.create({
    name: "Swifty Admin",
    email: "admin@swifty.com",
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log(
    "Default admin account created: admin@swifty.com"
  );
};

export default seedAdmin;