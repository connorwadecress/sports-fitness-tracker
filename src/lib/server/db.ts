import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Neon Postgres over HTTP: no connection pool to manage on serverless.
// Schema is created on first use, so a fresh database needs no migration step.

let client: NeonQueryFunction<false, false> | null = null;

export const dbConfigured = () => !!process.env.DATABASE_URL;

export function sql() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

const SCHEMA = [
  `create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    password_hash text not null,
    name text,
    consent_at timestamptz not null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists sessions (
    token_hash text primary key,
    user_id uuid not null references users(id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists sessions_user on sessions(user_id)`,
  `create sequence if not exists record_seq`,
  `create table if not exists records (
    user_id uuid not null references users(id) on delete cascade,
    collection text not null,
    id text not null,
    data jsonb not null,
    updated_at bigint not null,
    deleted boolean not null default false,
    seq bigint not null default nextval('record_seq'),
    primary key (user_id, collection, id)
  )`,
  `create index if not exists records_user_seq on records(user_id, seq)`,
  `create table if not exists push_subscriptions (
    endpoint text primary key,
    user_id uuid not null references users(id) on delete cascade,
    keys jsonb not null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists notifications_sent (
    user_id uuid not null references users(id) on delete cascade,
    key text not null,
    local_date text not null,
    sent_at timestamptz not null default now(),
    primary key (user_id, key)
  )`,
  `create table if not exists login_attempts (
    email text not null,
    at timestamptz not null default now()
  )`,
  `create index if not exists login_attempts_email on login_attempts(email, at)`,
];

let ready: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const q = sql();
      for (const s of SCHEMA) await q.query(s);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export async function db() {
  await ensureSchema();
  return sql();
}
