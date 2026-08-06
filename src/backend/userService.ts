/**
 * userService.ts
 * Serviço de gerenciamento de usuários do ÓRBITA.AECI usando PostgreSQL.
 * 
 * - Cria a tabela orbita_users automaticamente no boot
 * - Migra o admin (seed) para o PostgreSQL na primeira inicialização
 * - Todas as operações são assíncronas e tipadas
 */

import { pool } from "./db.js";
import bcrypt from "bcrypt";
import * as Seeds from "../data/seed_db.js";

const BCRYPT_ROUNDS = 12;

// ─────────────────────────────────────────────
// Tipo canônico de usuário
// ─────────────────────────────────────────────
export interface OrbUser {
  id: string;
  name: string;
  cpf?: string;
  siape?: string;
  phone?: string;
  email: string;
  role: string;
  unidade?: string;
  unidade_sigla?: string;
  clearance: "ADMIN" | "ETHICS" | "AUDITOR" | "SRTE" | "PUBLIC" | "PENDING";
  allowed_modules: string[];
  avatar_color: string;
  password_hash?: string;
  requires_password_change: boolean;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  badge_text: string;
  justificativa?: string;
  requested_at?: Date;
  approved_at?: Date;
  approved_by?: string;
  last_password_change?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// ─────────────────────────────────────────────
// DDL — criação da tabela e índices
// ─────────────────────────────────────────────
const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS orbita_users (
    id                       VARCHAR(50)  PRIMARY KEY,
    name                     VARCHAR(255) NOT NULL,
    cpf                      VARCHAR(14),
    siape                    VARCHAR(10),
    phone                    VARCHAR(25),
    email                    VARCHAR(255) UNIQUE NOT NULL,
    role                     VARCHAR(255),
    unidade                  VARCHAR(255),
    unidade_sigla            VARCHAR(50),
    clearance                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    allowed_modules          TEXT[]       NOT NULL DEFAULT '{}',
    avatar_color             VARCHAR(120) NOT NULL DEFAULT 'bg-slate-500 text-white',
    password_hash            VARCHAR(255),
    requires_password_change BOOLEAN      NOT NULL DEFAULT TRUE,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    badge_text               VARCHAR(100) NOT NULL DEFAULT 'PENDENTE',
    justificativa            TEXT,
    requested_at             TIMESTAMPTZ  DEFAULT NOW(),
    approved_at              TIMESTAMPTZ,
    approved_by              VARCHAR(50),
    last_password_change     TIMESTAMPTZ,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_orbita_users_cpf    ON orbita_users (cpf);
  CREATE INDEX IF NOT EXISTS idx_orbita_users_siape  ON orbita_users (siape);
  CREATE INDEX IF NOT EXISTS idx_orbita_users_email  ON orbita_users (email);
  CREATE INDEX IF NOT EXISTS idx_orbita_users_status ON orbita_users (status);
`;

// ─────────────────────────────────────────────
// Inicialização — chamada no boot do servidor
// ─────────────────────────────────────────────
export async function initUsersTable(): Promise<void> {
  try {
    await pool.query(CREATE_TABLE_SQL);
    console.log("[UserService] Tabela orbita_users pronta.");
    await migrateAdminSeed();
  } catch (err) {
    console.error("[UserService] Erro ao inicializar tabela de usuários:", err);
    throw err;
  }
}

/**
 * Garante que o admin seed sempre exista no banco com senha hasheada.
 * Se já existir, não faz nada.
 */
async function migrateAdminSeed(): Promise<void> {
  for (const seed of Seeds.SEED_PROFILES) {
    const exists = await pool.query(
      "SELECT id FROM orbita_users WHERE id = $1",
      [seed.id]
    );
    if (exists.rows.length === 0) {
      const rawPassword = seed.password || seed.pin || "Orbita@2026";
      const hash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);
      await pool.query(
        `INSERT INTO orbita_users
          (id, name, cpf, siape, phone, email, role, unidade, clearance, allowed_modules,
           avatar_color, password_hash, requires_password_change, status, badge_text,
           requested_at, approved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())`,
        [
          seed.id,
          seed.name,
          (seed as any).cpf || null,
          (seed as any).siape || null,
          (seed as any).phone || null,
          seed.email,
          seed.role,
          (seed as any).unidade || "AECI",
          seed.clearance,
          (seed as any).allowedModules || [],
          seed.avatarColor,
          hash,
          false,
          (seed as any).status || "ACTIVE",
          seed.badgeText,
        ]
      );
      console.log(`[UserService] Admin seed migrado para PostgreSQL: ${seed.id}`);
    }
  }
}

// ─────────────────────────────────────────────
// Helpers de mapeamento row → OrbUser
// ─────────────────────────────────────────────
function rowToUser(row: any): OrbUser {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    siape: row.siape,
    phone: row.phone,
    email: row.email,
    role: row.role,
    unidade: row.unidade,
    unidade_sigla: row.unidade_sigla,
    clearance: row.clearance,
    allowed_modules: row.allowed_modules || [],
    avatar_color: row.avatar_color,
    password_hash: row.password_hash,
    requires_password_change: row.requires_password_change,
    status: row.status,
    badge_text: row.badge_text,
    justificativa: row.justificativa,
    requested_at: row.requested_at,
    approved_at: row.approved_at,
    approved_by: row.approved_by,
    last_password_change: row.last_password_change,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ─────────────────────────────────────────────
// Queries de leitura
// ─────────────────────────────────────────────

/** Busca por CPF (apenas dígitos), e-mail ou id */
export async function findUserByIdentifier(identifier: string): Promise<OrbUser | null> {
  const cleanId = identifier.replace(/\D/g, "");
  const result = await pool.query(
    `SELECT * FROM orbita_users
     WHERE id = $1
        OR email = $1
        OR REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $2
     LIMIT 1`,
    [identifier, cleanId]
  );
  return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
}

/** Busca por SIAPE + CPF (para recuperação de senha — duplo fator) */
export async function findUserBySiapeAndCpf(siape: string, cpf: string): Promise<OrbUser | null> {
  const cleanCpf = cpf.replace(/\D/g, "");
  const result = await pool.query(
    `SELECT * FROM orbita_users
     WHERE siape = $1
       AND REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $2
       AND status = 'ACTIVE'
     LIMIT 1`,
    [siape.trim(), cleanCpf]
  );
  return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
}

/** Verifica se e-mail ou CPF já estão cadastrados */
export async function userExistsByEmailOrCpf(email: string, cpf: string): Promise<boolean> {
  const cleanCpf = cpf.replace(/\D/g, "");
  const result = await pool.query(
    `SELECT id FROM orbita_users
     WHERE email = $1
        OR REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $2
     LIMIT 1`,
    [email, cleanCpf]
  );
  return result.rows.length > 0;
}

/** Lista todos os usuários (para o painel admin) */
export async function listAllUsers(): Promise<OrbUser[]> {
  const result = await pool.query(
    `SELECT * FROM orbita_users ORDER BY
       CASE status WHEN 'PENDING' THEN 0 WHEN 'ACTIVE' THEN 1 ELSE 2 END,
       created_at DESC`
  );
  return result.rows.map(rowToUser);
}

// ─────────────────────────────────────────────
// Queries de escrita
// ─────────────────────────────────────────────

/** Cria novo usuário com status PENDING */
export async function createPendingUser(data: {
  name: string;
  cpf: string;
  siape?: string;
  phone?: string;
  email: string;
  role?: string;
  unidade?: string;
  unidadeSigla?: string;
  justificativa?: string;
}): Promise<OrbUser> {
  const id = "usr_" + Math.random().toString(36).substring(2, 11);
  const result = await pool.query(
    `INSERT INTO orbita_users
      (id, name, cpf, siape, phone, email, role, unidade, unidade_sigla,
       justificativa, clearance, status, badge_text, avatar_color,
       password_hash, requires_password_change, requested_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING','PENDING','PENDENTE',
             'bg-slate-400 text-white', NULL, TRUE, NOW())
     RETURNING *`,
    [
      id,
      data.name,
      data.cpf,
      data.siape || null,
      data.phone || null,
      data.email,
      data.role || "Não informado",
      data.unidade || null,
      data.unidadeSigla || null,
      data.justificativa || null,
    ]
  );
  return rowToUser(result.rows[0]);
}

/** Aprova um usuário, define clearance, módulos e gera senha hasheada */
export async function approveUser(
  id: string,
  payload: {
    role?: string;
    clearance: string;
    badgeText?: string;
    allowedModules?: string[];
  },
  approvedById: string,
  tempPassword: string
): Promise<OrbUser> {
  const hash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
  const result = await pool.query(
    `UPDATE orbita_users SET
       status = 'ACTIVE',
       clearance = $1,
       role = COALESCE($2, role),
       badge_text = COALESCE($3, badge_text),
       allowed_modules = $4,
       password_hash = $5,
       requires_password_change = TRUE,
       approved_at = NOW(),
       approved_by = $6,
       updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      payload.clearance || "PUBLIC",
      payload.role || null,
      payload.badgeText || null,
      payload.allowedModules || [],
      hash,
      approvedById,
      id,
    ]
  );
  return rowToUser(result.rows[0]);
}

/** Atualiza dados e permissões de um usuário sem afetar a senha */
export async function updateUser(
  id: string,
  payload: {
    name?: string;
    email?: string;
    siape?: string;
    role?: string;
    unidade?: string;
    clearance?: string;
    badgeText?: string;
    allowedModules?: string[];
  }
): Promise<OrbUser> {
  const result = await pool.query(
    `UPDATE orbita_users SET
       name = COALESCE($1, name),
       email = COALESCE($2, email),
       siape = COALESCE($3, siape),
       role = COALESCE($4, role),
       unidade = COALESCE($5, unidade),
       clearance = COALESCE($6, clearance),
       badge_text = COALESCE($7, badge_text),
       allowed_modules = COALESCE($8, allowed_modules),
       updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [
      payload.name || null,
      payload.email || null,
      payload.siape || null,
      payload.role || null,
      payload.unidade || null,
      payload.clearance || null,
      payload.badgeText || null,
      payload.allowedModules || null,
      id,
    ]
  );
  return rowToUser(result.rows[0]);
}

/** Inativa um usuário */
export async function inactivateUser(id: string): Promise<void> {
  await pool.query(
    "UPDATE orbita_users SET status = 'INACTIVE', updated_at = NOW() WHERE id = $1",
    [id]
  );
}

/** Reativa um usuário inativo */
export async function reactivateUser(id: string): Promise<void> {
  await pool.query(
    "UPDATE orbita_users SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1",
    [id]
  );
}

/** Atualiza a senha (com hash bcrypt) e marca como não provisória */
export async function updatePassword(id: string, newPasswordPlain: string): Promise<void> {
  const hash = await bcrypt.hash(newPasswordPlain, BCRYPT_ROUNDS);
  await pool.query(
    `UPDATE orbita_users SET
       password_hash = $1,
       requires_password_change = FALSE,
       last_password_change = NOW(),
       updated_at = NOW()
     WHERE id = $2`,
    [hash, id]
  );
}

/** Define nova senha provisória (para recuperação) */
export async function setProvisionalPassword(id: string, tempPasswordPlain: string): Promise<void> {
  const hash = await bcrypt.hash(tempPasswordPlain, BCRYPT_ROUNDS);
  await pool.query(
    `UPDATE orbita_users SET
       password_hash = $1,
       requires_password_change = TRUE,
       updated_at = NOW()
     WHERE id = $2`,
    [hash, id]
  );
}

/** Valida senha contra o hash do banco */
export async function verifyPassword(user: OrbUser, plainPassword: string): Promise<boolean> {
  if (!user.password_hash) return false;
  return bcrypt.compare(plainPassword, user.password_hash);
}

/** Gera senha provisória segura: 12 chars, mistura letras+números+símbolo */
export function generateTempPassword(): string {
  const upper  = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower  = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$!%&";
  const all = upper + lower + digits + symbols;

  const rand = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const password = [
    rand(upper),
    rand(upper),
    rand(lower),
    rand(lower),
    rand(digits),
    rand(digits),
    rand(symbols),
    ...Array.from({ length: 5 }, () => rand(all)),
  ];

  // Embaralha
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

/** Converte OrbUser para o formato de sessão do Express */
export function userToSessionFormat(user: OrbUser) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    register: user.siape ? `SIAPE: ${user.siape}` : (user.unidade || ""),
    clearance: user.clearance,
    avatarColor: user.avatar_color,
    badgeText: user.badge_text,
    allowedModules: user.allowed_modules,
  };
}
