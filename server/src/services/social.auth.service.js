import AppError from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { TTLCache } from "../utils/cache.js";

// Verified tokens are cached by value so double-submits don't hit Google twice.
const tokenCache = new TTLCache({ max: 5000, ttl: 60_000 });

/** Verify a Google id_token via Google's tokeninfo endpoint. */
async function verifyGoogleToken(idToken) {
  const cached = tokenCache.get(idToken);
  if (cached) return cached;

  let res, payload;
  try {
    res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
      signal: AbortSignal.timeout(5000),
    });
    payload = await res.json();
  } catch {
    throw new AppError("Could not reach Google to verify your sign-in. Please try again.", 503, "GOOGLE_UNREACHABLE");
  }

  if (!res.ok || payload.error) {
    throw new AppError("Your Google sign-in expired or is invalid. Please try again.", 401, "GOOGLE_TOKEN_INVALID");
  }
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (clientId && payload.aud !== clientId) {
    throw new AppError("This Google sign-in was not issued for Swifty.", 401, "GOOGLE_AUDIENCE_MISMATCH");
  }
  if (!payload.sub || !payload.email) {
    throw new AppError("Google did not share your email address. Please allow email access and try again.", 400, "GOOGLE_NO_EMAIL");
  }
  if (payload.email_verified !== "true" && payload.email_verified !== true) {
    throw new AppError("Your Google email address is not verified.", 403, "GOOGLE_EMAIL_UNVERIFIED");
  }

  const result = {
    sub: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.given_name || "",
    picture: payload.picture || null,
  };
  return tokenCache.set(idToken, result);
}

const toDto = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  roles: user.roles?.length ? user.roles : [user.role],
  activeMode: user.activeMode || user.role,
  avatarUrl: user.avatarUrl,
  department: user.department,
});

/**
 * If a user logs in with Google for the first time, auto-create the account
 * and return isNew: true so the frontend can show the mode selection modal.
 */
async function findOrCreateSocialUser({ provider, providerId, email, name, avatarUrl, role, intent = "login" }) {
  if (provider !== "google") throw new AppError("This sign-in provider is not supported.", 400, "UNSUPPORTED_PROVIDER");

  let user = await User.findOne({ $or: [{ googleId: providerId }, { email }] });
  let isNew = false;

  if (user && !user.googleId) {
    // Link Google to the existing email account.
    user.googleId = providerId;
    if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
    await user.save();
  }

  if (!user) {
    const safeRole = ["customer", "rider"].includes(role) ? role : "customer";
    try {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId: providerId,
        avatarUrl,
        role: safeRole,
        roles: ["customer", "rider"],
        activeMode: safeRole,
      });
      isNew = true;
    } catch (error) {
      if (error.code === 11000) throw new AppError("An account with this email already exists. Please sign in.", 409, "EMAIL_TAKEN");
      throw new AppError(
        error.message || "Failed to create account with Google. Please try again or sign up with email.",
        500,
        "GOOGLE_CREATE_FAILED"
      );
    }
  }

  if (!user.isActive) throw new AppError("This account has been deactivated. Contact support.", 403, "ACCOUNT_INACTIVE");

  return { accessToken: generateAccessToken(user), user: toDto(user), isNew };
}
// server/src/services/social.auth.service.js
export const verifyGoogleAndAuthenticate = async ({ idToken, requestedMode = 'customer' }) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      throw new AppError('Google account does not provide a valid email address.', 400);
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    let isFirstTimeUser = false;

    if (!user) {
      // Automatically sign them up on first-time Google login
      const safeMode = requestedMode === 'rider' ? 'rider' : 'customer';
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        roles: ['customer', 'rider'],
        activeMode: safeMode,
        isEmailVerified: true,
        hasCompletedModeOnboarding: false, // Triggers Mode + Theme Modal on frontend
      });
      isFirstTimeUser = true;
    } else {
      // Ensure existing users have shared role capability
      if (!user.roles.includes('customer')) user.roles.push('customer');
      if (!user.roles.includes('rider')) user.roles.push('rider');
      if (!user.googleId) user.googleId = googleId;
      if (requestedMode && ['customer', 'rider'].includes(requestedMode) && user.activeMode !== 'admin') {
        user.activeMode = requestedMode;
      }
      await user.save();
    }

    const token = signJwtToken(user._id, user.activeMode);
    return { user, token, isFirstTimeUser };
  } catch (error) {
    const err = new AppError(
      'We could not complete your Google sign-in automatically. Please complete registration on the Sign Up page.',
      400
    );
    err.code = 'GOOGLE_AUTO_SIGNUP_FAILED';
    err.signupUrl = `/auth?view=signup&mode=${requestedMode}`;
    throw err;
  }
};
export { verifyGoogleToken, findOrCreateSocialUser };
