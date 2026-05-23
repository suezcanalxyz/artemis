import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { config } from "../config.js";
import { redis } from "./redis.js";

type AccessPayload = {
  kind: "access";
  userId: string;
  profileId: string;
  email: string;
};

type RefreshPayload = {
  kind: "refresh";
  userId: string;
  profileId: string;
  email: string;
  sessionId: string;
  jti: string;
};

type SessionIdentity = {
  userId: string;
  profileId: string;
  email: string;
};

const sessionKey = (sessionId: string) => `refresh:session:${sessionId}`;
const revokedKey = (jti: string) => `refresh:revoked:${jti}`;

export const signAccessToken = (identity: SessionIdentity) =>
  jwt.sign(
    { ...identity, kind: "access" } satisfies AccessPayload,
    config.JWT_SECRET,
    {
      expiresIn: config.ACCESS_TOKEN_TTL as StringValue
    }
  );

async function storeSession(
  sessionId: string,
  jti: string,
  ttlSeconds: number
) {
  await redis.set(sessionKey(sessionId), jti, "EX", ttlSeconds);
}

export async function issueSessionTokens(
  identity: SessionIdentity,
  sessionId?: string
) {
  const activeSessionId = sessionId ?? randomUUID();
  const jti = randomUUID();
  const refresh = jwt.sign(
    {
      ...identity,
      sessionId: activeSessionId,
      jti,
      kind: "refresh"
    } satisfies RefreshPayload,
    config.JWT_SECRET,
    { expiresIn: config.REFRESH_TOKEN_TTL as StringValue }
  );
  const decoded = jwt.decode(refresh) as { exp?: number } | null;
  const ttlSeconds = Math.max(
    (decoded?.exp ?? 0) - Math.floor(Date.now() / 1000),
    1
  );
  await storeSession(activeSessionId, jti, ttlSeconds);

  return { accessToken: signAccessToken(identity), refreshToken: refresh };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET) as AccessPayload;
}

export async function rotateRefreshToken(token: string) {
  const payload = jwt.verify(token, config.JWT_SECRET) as RefreshPayload;
  if (payload.kind !== "refresh") throw new Error("Invalid token kind");
  if (await redis.exists(revokedKey(payload.jti)))
    throw new Error("Revoked token");

  const currentJti = await redis.get(sessionKey(payload.sessionId));
  if (!currentJti || currentJti !== payload.jti) {
    await redis.del(sessionKey(payload.sessionId));
    throw new Error("Refresh token has been rotated");
  }

  await redis.set(revokedKey(payload.jti), "1", "EX", 60 * 60 * 24 * 30);
  return issueSessionTokens(
    {
      userId: payload.userId,
      profileId: payload.profileId,
      email: payload.email
    },
    payload.sessionId
  );
}

export async function revokeRefreshToken(token: string) {
  const payload = jwt.verify(token, config.JWT_SECRET) as RefreshPayload;
  await Promise.all([
    redis.del(sessionKey(payload.sessionId)),
    redis.set(revokedKey(payload.jti), "1", "EX", 60 * 60 * 24 * 30)
  ]);
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, config.JWT_SECRET) as RefreshPayload;
  if (payload.kind !== "refresh") throw new Error("Invalid token kind");
  return payload;
}
