import { registerUser, loginUser, changePassword, forgotPassword as forgotPasswordService, resetPassword as resetPasswordService } from "../services/auth.services.js";
import { verifyGoogleToken, findOrCreateSocialUser } from "../services/social.auth.service.js";
import { generateAccessToken } from "../utils/jwt.js";

const register = async (req, res) => {
  const { accessToken, user } = await registerUser(req.body);
  return res.status(201).json({ success: true, message: "Account created successfully", accessToken, user });
};

const login = async (req, res) => {
  const { accessToken, user } = await loginUser(req.body);
  return res.status(200).json({ success: true, message: "Login successful", accessToken, user });
};

const me = async (req, res) => {
  const user = req.user;
  return res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roles: user.roles?.length ? user.roles : [user.role || "customer"],
      activeMode: user.activeMode || user.role || "customer",
      department: user.department,
      avatarUrl: user.avatarUrl,
    },
  });
};

const updatePassword = async (req, res) => {
  await changePassword(req.user._id, req.body.password);
  return res.status(200).json({ success: true, message: "Password updated successfully" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  const result = await forgotPasswordService(email);
  return res.status(200).json({ success: true, ...result });
};

const resetPassword = async (req, res) => {
  const { token, newPassword, password, code } = req.body || {};
  const resetToken = token || code;
  const pass = newPassword || password;
  if (!resetToken || !pass) {
    return res.status(400).json({ success: false, message: "Token and new password are required" });
  }
  const result = await resetPasswordService(resetToken, pass);
  return res.status(200).json({ success: true, ...result });
};

const switchMode = async (req, res) => {
  const { mode } = req.body || {};
  if (!mode || !["customer", "rider"].includes(mode)) {
    return res.status(400).json({ success: false, code: "INVALID_MODE", message: "Mode must be 'customer' or 'rider'" });
  }

  const user = req.user;
  const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role || "customer"];

  if (!userRoles.includes(mode)) {
    return res.status(403).json({
      success: false,
      code: "ROLE_NOT_FOUND",
      message: `You do not have the '${mode}' role. Please add this role before switching to it.`,
    });
  }

  user.activeMode = mode;
  user.role = mode;
  await user.save();

  const accessToken = generateAccessToken(user);
  return res.status(200).json({
    success: true,
    message: `Switched to ${mode} mode`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roles: user.roles,
      activeMode: user.activeMode,
      department: user.department,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
  });
};

const addRole = async (req, res) => {
  const { role } = req.body || {};
  if (role === "admin") {
    return res.status(403).json({ success: false, code: "FORBIDDEN", message: "Cannot add admin role" });
  }
  if (!role || !["customer", "rider"].includes(role)) {
    return res.status(400).json({ success: false, code: "INVALID_ROLE", message: "Role must be 'customer' or 'rider'" });
  }

  const user = req.user;
  const currentRoles = user.roles && user.roles.length > 0 ? [...user.roles] : [user.role || "customer"];

  if (!currentRoles.includes(role)) {
    currentRoles.push(role);
    user.roles = currentRoles;
    await user.save();
  }

  return res.status(200).json({
    success: true,
    message: `Role '${role}' added successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roles: user.roles,
      activeMode: user.activeMode,
      department: user.department,
      avatarUrl: user.avatarUrl,
    },
  });
};

const socialLogin = async (req, res) => {
  const { provider, idToken, role, intent } = req.body || {};
  if (!provider || !idToken) {
    return res.status(400).json({ success: false, code: "BAD_REQUEST", message: "Google sign-in data is missing. Please try again." });
  }
  if (provider !== "google") {
    return res.status(400).json({ success: false, code: "UNSUPPORTED_PROVIDER", message: "This sign-in provider is not supported." });
  }
  const payload = await verifyGoogleToken(idToken);
  const result = await findOrCreateSocialUser({
    provider, providerId: payload.sub, email: payload.email, name: payload.name,
    avatarUrl: payload.picture, role, intent: intent === "signup" ? "signup" : "login",
  });
  return res.status(200).json({ success: true, message: result.isNew ? "Account created successfully" : "Login successful", ...result });
};

export { register, login, me, updatePassword, forgotPassword, resetPassword, socialLogin, switchMode, addRole };

