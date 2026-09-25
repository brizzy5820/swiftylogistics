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
  const { provider, idToken, role } = req.body;
  if (!provider || !idToken) {
    return res.status(400).json({ success: false, message: "provider and idToken are required" });
  }

  let payload;
  if (provider === "google") {
    payload = await verifyGoogleToken(idToken);
  } else {
    return res.status(400).json({ success: false, message: "Unsupported provider" });
  }

  const { accessToken, user } = await findOrCreateSocialUser({
    provider,
    providerId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.picture,
    role,
  });

  return res.status(200).json({ success: true, message: "Login successful", accessToken, user });
};

export { register, login, me, updatePassword, socialLogin };

