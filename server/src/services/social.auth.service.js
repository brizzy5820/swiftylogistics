import AppError from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";

/**
 * Verify a Google id_token by calling Google's tokeninfo endpoint.
 * Returns { sub, email, name, picture } on success.
 */
async function verifyGoogleToken(idToken) {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetch(url);
  const payload = await res.json();

  if (!res.ok || payload.error) {
    throw new AppError("Google token verification failed", 401);
  }

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  if (clientId && payload.aud !== clientId) {
    throw new AppError("Google token audience mismatch", 401);
  }

  if (!payload.sub || !payload.email) {
    throw new AppError("Incomplete Google token payload", 401);
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.given_name || "",
    picture: payload.picture || null,
  };
}

/**
 * Find an existing user by their social provider ID or email, or create a new one.
 * Returns { accessToken, user }.
 */
async function findOrCreateSocialUser({ provider, providerId, email, name, avatarUrl, role }) {
  const providerKey = provider === "google" ? "googleId" : null;
  if (!providerKey) throw new AppError("Unsupported provider", 400);

  // 1. Try to find by provider ID
  let user = await User.findOne({ [providerKey]: providerId });

  // 2. Fall back to email match — link the social ID to the existing account
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user[providerKey] = providerId;
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    }
  }

  // 3. Create a brand-new account
  if (!user) {
    const normalizedRole = ["customer", "rider"].includes(role) ? role : "customer";
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      [providerKey]: providerId,
      avatarUrl: avatarUrl || null,
      role: normalizedRole,
      // passwordHash intentionally omitted — social-only account
    });
  }

  if (!user.isActive) throw new AppError("This account is inactive", 403);

  const accessToken = generateAccessToken(user);
  return {
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  };
}

export { verifyGoogleToken, findOrCreateSocialUser };
