
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import process from "node:process";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/job_application_tracker";
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`;
const jwtSecret = process.env.JWT_SECRET || randomBytes(32).toString("hex");
const tokenLifetimeMs = 24 * 60 * 60 * 1000;
const oauthCookiePath = "/api/auth/google";
const oauthCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 5 * 60 * 1000,
  path: oauthCookiePath,
};

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be configured in production.");
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
const applicationStatuses = ["Applied", "Interview", "Offer", "Declined"];
const applicationSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    status: { type: String, enum: applicationStatuses, default: "Applied" },
    appliedAt: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true },
);

const JobApplication = mongoose.model("JobApplication", applicationSchema);

// Middleware
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));

function getRequestCookie(req, name) {
  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function googleErrorRedirect(flow, error) {
  const path = flow === "signup" ? "/signup" : "/login";
  return `${CLIENT_ORIGIN}${path}?oauthError=${encodeURIComponent(error)}`;
}

function clearGoogleOAuthCookies(res) {
  res.clearCookie("google_oauth_state", { ...oauthCookieOptions, maxAge: undefined });
  res.clearCookie("google_code_verifier", { ...oauthCookieOptions, maxAge: undefined });
}

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "1d" });
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: tokenLifetimeMs,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

function requireAuth(req, res, next) {
  try {
    const authCookie = req.headers.cookie
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("auth_token="));
    if (!authCookie) return res.status(401).json({ error: "Please log in to continue." });

    const token = decodeURIComponent(authCookie.slice("auth_token=".length));
    const payload = jwt.verify(token, jwtSecret);
    if (typeof payload === "string" || !payload.sub) {
      return res.status(401).json({ error: "Your session is invalid. Please log in again." });
    }

    req.userId = payload.sub;
    return next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
}

function validateCredentials(email, password) {
  if (typeof email !== "string" || typeof password !== "string") {
    return "Email and password are required.";
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return "Enter a valid email address.";
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return "Password must be at least 8 characters and no more than 72 bytes.";
  }

  return null;
}

function validateApplication(body) {
  const { company, role, location = "", status = "Applied", appliedAt, notes = "" } = body ?? {};
  if (typeof company !== "string" || !company.trim() || company.trim().length > 120) {
    return { error: "Company is required and must be 120 characters or fewer." };
  }
  if (typeof role !== "string" || !role.trim() || role.trim().length > 120) {
    return { error: "Job title is required and must be 120 characters or fewer." };
  }
  if (!applicationStatuses.includes(status)) {
    return { error: "Choose a valid application status." };
  }
  if (typeof location !== "string" || location.length > 120) {
    return { error: "Location must be 120 characters or fewer." };
  }
  if (typeof notes !== "string" || notes.length > 2000) {
    return { error: "Notes must be 2,000 characters or fewer." };
  }

  const applicationDate = appliedAt ? new Date(appliedAt) : new Date();
  if (Number.isNaN(applicationDate.getTime())) {
    return { error: "Enter a valid application date." };
  }

  return {
    value: {
      company: company.trim(),
      role: role.trim(),
      location: location.trim(),
      status,
      appliedAt: applicationDate,
      notes: notes.trim(),
    },
  };
}

// Test API endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Job Application Tracker API is running!",
  });
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body ?? {};
  const validationError = validateCredentials(email, password);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: normalizedEmail, passwordHash });
    setAuthCookie(res, user.id);
    return res.status(201).json({ message: "Account created successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    return res.status(500).json({ error: "Unable to create your account right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const validationError = validateCredentials(email, password);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    setAuthCookie(res, user.id);
    return res.json({ message: "Logged in successfully." });
  } catch {
    return res.status(500).json({ error: "Unable to log in right now." });
  }
});

app.get("/api/auth/google", async (req, res) => {
  const flow = req.query.flow === "signup" ? "signup" : "login";
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(303, googleErrorRedirect(flow, "configuration"));
  }

  try {
    const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
    const { codeVerifier, codeChallenge } = await oauthClient.generateCodeVerifierAsync();
    const state = randomBytes(32).toString("hex");
    const signedState = jwt.sign({ state, flow }, jwtSecret, { expiresIn: "5m" });

    res.cookie("google_oauth_state", signedState, oauthCookieOptions);
    res.cookie("google_code_verifier", codeVerifier, oauthCookieOptions);

    const authorizationUrl = oauthClient.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    return res.redirect(authorizationUrl);
  } catch {
    return res.redirect(303, googleErrorRedirect(flow, "failed"));
  }
});

app.get("/api/auth/google/callback", async (req, res) => {
  let flow = "login";
  const signedState = getRequestCookie(req, "google_oauth_state");
  const codeVerifier = getRequestCookie(req, "google_code_verifier");
  clearGoogleOAuthCookies(res);

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect(303, googleErrorRedirect(flow, "configuration"));
    }
    if (!signedState || !codeVerifier) {
      return res.redirect(303, googleErrorRedirect(flow, "state"));
    }

    const statePayload = jwt.verify(signedState, jwtSecret);
    if (typeof statePayload === "string" || !statePayload.state) {
      return res.redirect(303, googleErrorRedirect(flow, "state"));
    }
    flow = statePayload.flow === "signup" ? "signup" : "login";
    if (typeof req.query.state !== "string" || req.query.state !== statePayload.state) {
      return res.redirect(303, googleErrorRedirect(flow, "state"));
    }
    if (req.query.error === "access_denied") {
      return res.redirect(303, googleErrorRedirect(flow, "cancelled"));
    }
    if (typeof req.query.code !== "string") {
      return res.redirect(303, googleErrorRedirect(flow, "failed"));
    }

    const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
    const { tokens } = await oauthClient.getToken({ code: req.query.code, codeVerifier });
    if (!tokens.id_token) return res.redirect(303, googleErrorRedirect(flow, "failed"));

    const ticket = await oauthClient.verifyIdToken({ idToken: tokens.id_token, audience: GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      return res.redirect(303, googleErrorRedirect(flow, "unverified"));
    }

    const email = profile.email.trim().toLowerCase();
    let user = await User.findOne({ googleId: profile.sub }).select("+googleId");
    if (!user) {
      user = await User.findOne({ email }).select("+googleId");
      if (user) {
        if (user.googleId && user.googleId !== profile.sub) {
          return res.redirect(303, googleErrorRedirect(flow, "account"));
        }
        user.googleId = profile.sub;
        await user.save();
      } else {
        try {
          user = await User.create({ email, googleId: profile.sub });
        } catch (error) {
          if (error.code !== 11000) throw error;
          user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] }).select("+googleId");
          if (!user || (user.googleId && user.googleId !== profile.sub)) throw error;
          if (!user.googleId) {
            user.googleId = profile.sub;
            await user.save();
          }
        }
      }
    }

    setAuthCookie(res, user.id);
    return res.redirect(303, `${CLIENT_ORIGIN}/dashboard`);
  } catch {
    return res.redirect(303, googleErrorRedirect(flow, "failed"));
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("email").lean();
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "Account not found. Please log in again." });
    }
    return res.json({ user: { id: user._id, email: user.email } });
  } catch {
    return res.status(500).json({ error: "Unable to load your account." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Logged out successfully." });
});

app.get("/api/applications", requireAuth, async (req, res) => {
  try {
    const applications = await JobApplication.find({ ownerId: req.userId })
      .sort({ appliedAt: -1, createdAt: -1 })
      .lean();
    return res.json({ applications });
  } catch {
    return res.status(500).json({ error: "Unable to load applications." });
  }
});

app.post("/api/applications", requireAuth, async (req, res) => {
  const validation = validateApplication(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });

  try {
    const application = await JobApplication.create({ ...validation.value, ownerId: req.userId });
    return res.status(201).json({ application });
  } catch {
    return res.status(500).json({ error: "Unable to create this application." });
  }
});

app.put("/api/applications/:id", requireAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Application not found." });
  }
  const validation = validateApplication(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });

  try {
    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId },
      validation.value,
      { new: true, runValidators: true },
    ).lean();
    if (!application) return res.status(404).json({ error: "Application not found." });
    return res.json({ application });
  } catch {
    return res.status(500).json({ error: "Unable to update this application." });
  }
});

app.delete("/api/applications/:id", requireAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Application not found." });
  }

  try {
    const application = await JobApplication.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.userId,
    });
    if (!application) return res.status(404).json({ error: "Application not found." });
    return res.status(204).end();
  } catch {
    return res.status(500).json({ error: "Unable to delete this application." });
  }
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    await JobApplication.updateMany({ status: "Rejected" }, { $set: { status: "Declined" } });
    app.listen(PORT, () => {
      console.log(`API server running at http://localhost:${PORT}`);
    });
  } catch {
    console.error("MongoDB connection failed. Check that MongoDB is running and MONGODB_URI is correct.");
    process.exit(1);
  }
}

startServer();
