import { registerUser, loginUser, changePassword } from "../services/auth.services.js";
import { verifyGoogleToken, findOrCreateSocialUser } from "../services/social.auth.service.js";

const register = async (req, res) => {
  const { accessToken, user } = await registerUser(req.body);
  return res.status(201).json({ success: true, message: "Account created successfully", accessToken, user });
};

const login = async (req, res) => {
  const { accessToken, user } = await loginUser(req.body);
  return res.status(200).json({ success: true, message: "Login successful", accessToken, user });
};

const me = async (req, res) => res.status(200).json({ success: true, user: req.user });

const updatePassword = async (req, res) => {
  await changePassword(req.user._id, req.body.password);
  return res.status(200).json({ success: true, message: "Password updated successfully" });
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

export { register, login, me, updatePassword, socialLogin };

