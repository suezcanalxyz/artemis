import { randomUUID } from "node:crypto";
import { writeAuditLog } from "../lib/audit.js";
import { sql } from "../lib/db.js";
import { AppError, validationError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/hashing.js";
import {
  issueSessionTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyRefreshToken
} from "../lib/sessionTokens.js";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  profile_id: string;
  role?: string;
  plan?: string;
  onboarding_completed?: boolean;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `artist-${randomUUID().slice(0, 8)}`;

export async function register(email: string, password: string) {
  const existing = await sql<{ id: string }[]>`
    select id from users where email = ${email}
  `;
  if (existing.length)
    throw validationError("Email already in use", { email: "Already exists" });

  const passwordHash = await hashPassword(password);
  const displayName = email.split("@")[0] || "Artist";
  const slug = slugify(displayName);

  const [created] = await sql<UserRow[]>`
    with new_user as (
      insert into users (email, password_hash)
      values (${email}, ${passwordHash})
      returning id, email, password_hash
    ), new_profile as (
      insert into profiles (user_id, slug, display_name, kind)
      select id, ${slug}, ${displayName}, 'artist' from new_user
      returning id as profile_id, user_id
    )
    select new_user.id, new_user.email, new_user.password_hash, new_profile.profile_id
    from new_user join new_profile on new_profile.user_id = new_user.id
  `;

  const tokens = await issueSessionTokens({
    userId: created.id,
    profileId: created.profile_id,
    email: created.email
  });
  await writeAuditLog({
    actorId: created.id,
    entityType: "user",
    entityId: created.id,
    action: "auth.register",
    payload: { email: created.email }
  });

  return {
    ...tokens,
    user: {
      id: created.id,
      email: created.email,
      profileId: created.profile_id,
      onboardingCompleted: false,
      role: "artist",
      plan: "artist_free"
    }
  };
}

export async function login(email: string, password: string) {
  const [user] = await sql<UserRow[]>`
    select users.id, users.email, users.password_hash, profiles.id as profile_id,
           profiles.role, profiles.plan, profiles.onboarding_completed
    from users
    join profiles on profiles.user_id = users.id
    where users.email = ${email}
  `;
  if (!user) throw validationError("Invalid email or password");

  const valid = await verifyPassword(user.password_hash, password);
  if (!valid) throw validationError("Invalid email or password");

  const tokens = await issueSessionTokens({
    userId: user.id,
    profileId: user.profile_id,
    email: user.email
  });
  await writeAuditLog({
    actorId: user.id,
    entityType: "user",
    entityId: user.id,
    action: "auth.login",
    payload: { email: user.email }
  });

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      profileId: user.profile_id,
      onboardingCompleted: user.onboarding_completed ?? false,
      role: user.role ?? "artist",
      plan: user.plan ?? "artist_free"
    }
  };
}

export async function me(userId: string) {
  const [user] = await sql<
    {
      id: string;
      email: string;
      profile_id: string;
      role: string;
      plan: string;
      onboarding_completed: boolean;
    }[]
  >`
    select users.id, users.email, profiles.id as profile_id,
           profiles.role, profiles.plan, profiles.onboarding_completed
    from users
    join profiles on profiles.user_id = users.id
    where users.id = ${userId}
  `;
  return user;
}

export async function refresh(refreshToken: string) {
  try {
    const tokens = await rotateRefreshToken(refreshToken);
    const decoded = verifyRefreshToken(refreshToken);
    await writeAuditLog({
      actorId: decoded.userId,
      entityType: "user",
      entityId: decoded.userId,
      action: "auth.refresh",
      payload: {}
    });
    return tokens;
  } catch {
    throw new AppError(401, "AUTH_REQUIRED", "Invalid refresh token");
  }
}

export async function logout(refreshToken: string) {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    await revokeRefreshToken(refreshToken);
    await writeAuditLog({
      actorId: decoded.userId,
      entityType: "user",
      entityId: decoded.userId,
      action: "auth.logout",
      payload: {}
    });
  } catch {
    throw new AppError(401, "AUTH_REQUIRED", "Invalid refresh token");
  }
}
