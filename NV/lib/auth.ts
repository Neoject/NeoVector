// lib/auth.ts
import { Pool } from "mysql2/promise";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { getIronSession } from "iron-session";

// ─── Session types ────────────────────────────────────────────────────────────

export interface SessionData {
  userId?: number;
  username?: string;
  role?: string;
}

const SESSION_OPTIONS = {
  cookieName: "session",
  password: process.env.SESSION_SECRET as string, // min 32 chars in .env
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// ─── DB bootstrap ─────────────────────────────────────────────────────────────

export async function ensureTables(db: Pool): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      username      VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS remember_tokens (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

export async function ensureAdminUser(db: Pool): Promise<void> {
  const [rows] = await db.query<any[]>(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    ["admin"]
  );

  if (rows.length === 0) {
    // ⚠️  Change the default password via env var before deploying!
    const plain = process.env.ADMIN_INITIAL_PASSWORD ?? "changeme";
    const hash = await bcrypt.hash(plain, 12);
    await db.query(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      ["admin", hash, "admin"]
    );
  }
}

// Call once at app startup (e.g. from instrumentation.ts)
export async function initAuth(): Promise<void> {
  const db = getDb();
  await ensureTables(db);
  await ensureAdminUser(db);
}

// ─── Auth logic ───────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string,
  remember = false
): Promise<{ success: boolean; role?: string; error?: string }> {
  username = username.trim();

  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }

  const db = getDb();
  const [rows] = await db.query<any[]>(
    "SELECT id, password_hash, role FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  const user = rows[0];
  const valid =
    user && (await bcrypt.compare(password, user.password_hash));

  if (!valid) {
    return { success: false, error: "Invalid username or password" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = username;
  session.role = user.role;
  await session.save();

  if (remember) {
    await createRememberToken(db, user.id);
  }

  return { success: true, role: user.role };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get("remember_token")?.value;

  if (rawToken) {
    const hash = sha256(rawToken);
    await getDb().query(
      "DELETE FROM remember_tokens WHERE token_hash = ?",
      [hash]
    );

    // Clear the cookie by setting it expired
    cookieStore.set("remember_token", "", {
      expires: new Date(0),
      path: "/",
    });
  }

  const session = await getSession();
  session.destroy();
}

// ─── Remember-me ─────────────────────────────────────────────────────────────

async function createRememberToken(db: Pool, userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = sha256(token);
  const expiresMs = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const expires = new Date(expiresMs)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  await db.query(
    "INSERT INTO remember_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, hash, expires]
  );

  const cookieStore = await cookies();
  cookieStore.set("remember_token", token, {
    expires: new Date(expiresMs),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function autoLoginFromRememberToken(): Promise<void> {
  const session = await getSession();
  if (session.userId) return;

  const cookieStore = await cookies();
  const rawToken = cookieStore.get("remember_token")?.value;
  if (!rawToken) return;

  const hash = sha256(rawToken);
  const db = getDb();

  const [rows] = await db.query<any[]>(
    `SELECT u.id, u.username, u.role
     FROM remember_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ? AND rt.expires_at > NOW()
     LIMIT 1`,
    [hash]
  );

  const user = rows[0];
  if (user) {
    session.userId = user.id;
    session.username = user.username;
    session.role = user.role;
    await session.save();
  }
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return {
    userId: session.userId,
    username: session.username,
    role: session.role,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session.userId;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.role === "admin";
}
