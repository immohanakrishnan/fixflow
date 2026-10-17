import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";

const ACCESS_TOKEN_SECONDS = 15 * 60;
const REFRESH_TOKEN_DAYS = 30;

export type MobilePrincipal = {
  id: string;
  name: string;
  email: string;
  role: "TENANT" | "TECHNICIAN";
};

type AccessPayload = {
  sub: string;
  sid: string;
  role: MobilePrincipal["role"];
  iat: number;
  exp: number;
  typ: "mobile-access";
};

function secret() {
  const value = process.env.MOBILE_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("MOBILE_AUTH_SECRET or AUTH_SECRET must be at least 32 characters.");
  }
  return value;
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signAccessToken(payload: AccessPayload) {
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret())
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function userForMobile(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantProfile?: { status: string; deletedAt: Date | null } | null;
  technician?: { active: boolean; deletedAt: Date | null } | null;
}): MobilePrincipal | null {
  if (user.role === "TENANT") {
    if (!user.tenantProfile || user.tenantProfile.status !== "ACTIVE" || user.tenantProfile.deletedAt) return null;
    return { id: user.id, name: user.name, email: user.email, role: "TENANT" };
  }
  if (user.role === "TECHNICIAN") {
    if (!user.technician || !user.technician.active || user.technician.deletedAt) return null;
    return { id: user.id, name: user.name, email: user.email, role: "TECHNICIAN" };
  }
  return null;
}

function issueTokens(principal: MobilePrincipal, sessionId: string) {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = signAccessToken({
    sub: principal.id,
    sid: sessionId,
    role: principal.role,
    iat: now,
    exp: now + ACCESS_TOKEN_SECONDS,
    typ: "mobile-access",
  });
  return accessToken;
}

export async function mobileLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      tenantProfile: { select: { status: true, deletedAt: true } },
      technician: { select: { active: true, deletedAt: true } },
    },
  });
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  const principal = userForMobile(user);
  if (!principal) return null;

  const refreshToken = randomBytes(48).toString("base64url");
  const session = await prisma.mobileSession.create({
    data: {
      userId: principal.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  const accessToken = issueTokens(principal, session.id);
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_SECONDS,
    user: principal,
  };
}

export async function mobileRefresh(refreshToken: string) {
  const session = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash: hashRefreshToken(refreshToken) },
    include: {
      user: {
        include: {
          tenantProfile: { select: { status: true, deletedAt: true } },
          technician: { select: { active: true, deletedAt: true } },
        },
      },
    },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  const principal = userForMobile(session.user);
  if (!principal) {
    await prisma.mobileSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return null;
  }

  const currentHash = hashRefreshToken(refreshToken);
  const nextRefreshToken = randomBytes(48).toString("base64url");
  const rotated = await prisma.mobileSession.updateMany({
    where: {
      id: session.id,
      refreshTokenHash: currentHash,
      revokedAt: null,
    },
    data: { refreshTokenHash: hashRefreshToken(nextRefreshToken), lastUsedAt: new Date() },
  });
  if (rotated.count !== 1) return null;
  const accessToken = issueTokens(principal, session.id);
  return { accessToken, refreshToken: nextRefreshToken, expiresIn: ACCESS_TOKEN_SECONDS, user: principal };
}

export async function mobileLogout(refreshToken: string) {
  await prisma.mobileSession.updateMany({
    where: { refreshTokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const [encodedHeader, encodedBody, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedBody || !encodedSignature) return null;
    const expected = createHmac("sha256", secret())
      .update(`${encodedHeader}.${encodedBody}`)
      .digest();
    const received = Buffer.from(encodedSignature, "base64url");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString()) as AccessPayload;
    if (payload.typ !== "mobile-access" || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function mobilePrincipalFromToken(token: string) {
  const payload = verifyAccessToken(token);
  if (!payload) return null;
  const session = await prisma.mobileSession.findUnique({
    where: { id: payload.sid },
    include: {
      user: {
        include: {
          tenantProfile: { select: { status: true, deletedAt: true } },
          technician: { select: { active: true, deletedAt: true } },
        },
      },
    },
  });
  if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) return null;
  return userForMobile(session.user);
}
