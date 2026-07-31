import express from "express";
import { StorageManager } from "./src/services/db/StorageManager";
import path from "path";
import fs from "fs";
import https from "https";
import readline from "readline";
import { Readable } from "stream";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import session from "express-session";
import pgSession from 'connect-pg-simple';
import compression from 'compression';
import pg from "pg";

import comunicacoesRoutes from "./src/backend/routes/comunicacoesRoutes.js";
import rolRoutes from "./src/backend/routes/rolRoutes.js";
import acordaoRoutes from "./src/backend/routes/acordaoRoutes.js";
import tceRoutes from "./src/backend/routes/tceRoutes.js";
import eticaRoutes from "./src/backend/routes/eticaRoutes.js";
import scdpRoutes from "./src/backend/routes/scdpRoutes.js";
import cguRoutes from "./src/backend/routes/cguRoutes.js";
import cguAuditoriasRoutes from "./src/backend/routes/cguAuditoriasRoutes.js";
import superintendenciasRoutes from "./src/backend/routes/superintendenciasRoutes.js";
import contratosRoutes from "./src/backend/routes/contratosRoutes.js";
import viaturasRoutes from "./src/backend/routes/viaturasRoutes.js";
import rolLegacyRoutes from "./src/backend/routes/rolLegacyRoutes.js";
import dashboardRoutes from "./src/backend/routes/dashboardRoutes.js";
import { pool } from "./src/backend/db";
// User management services (PostgreSQL + bcrypt + e-mail)
import {
  initUsersTable, findUserByIdentifier, findUserBySiapeAndCpf,
  userExistsByEmailOrCpf, listAllUsers, createPendingUser, approveUser,
  updateUser, inactivateUser, reactivateUser, updatePassword, setProvisionalPassword,
  verifyPassword, generateTempPassword, userToSessionFormat,
} from "./src/backend/userService.js";
import {
  sendAccessRequestNotification, sendAccessApprovedEmail, sendPasswordResetEmail,
} from "./src/backend/emailService.js";
import { runImportCguAuditorias } from "./src/backend/utils/importCguAuditorias.js";
// Load environment variables
dotenv.config();

// PostgreSQL pool for GovHub BR connection (defaults to local Docker credentials)
const govHubPool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://airflow:airflow@localhost:5432/postgres",
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000, // Fast timeout so it fails quickly if GovHub docker is not running
});

function getSiapeAndEmail(nameStr: string) {
  const name = String(nameStr || "").toUpperCase();
  if (name.includes("SARAH DE MATTOS OLIVEIRA")) {
    return { siape: "1540928", email: "sarah.oliveira@trabalho.gov.br" };
  }
  if (name.includes("CASSIANO HILARIO LUCK GONCALVES")) {
    return { siape: "2390105", email: "cassiano.goncalves@trabalho.gov.br" };
  }
  if (name.includes("JOSE CLAUDIO SILVA BARRETO")) {
    return { siape: "1827491", email: "jose.barreto@trabalho.gov.br" };
  }
  if (name.includes("JOAO ANTUNES SOARES")) {
    return { siape: "1192834", email: "joao.soares@trabalho.gov.br" };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const cleanHash = Math.abs(hash);
  const siape = String(1000000 + (cleanHash % 900000));
  const parts = name.toLowerCase().split(" ").filter(p => p.length > 2);
  const firstName = parts[0] || "viajante";
  const lastName = parts[parts.length - 1] || "servidor";
  return { siape, email: `${firstName}.${lastName}@trabalho.gov.br` };
}

declare module 'express-session' {
  interface SessionData {
    lastHeartbeat?: number;
    user?: {
      id: string;
      name: string;
      role: string;
      email: string;
      register: string;
      clearance: string;
      avatarColor: string;
      badgeText: string;
      allowedModules?: string[];
    };
  }
}

// Standard types
import { 
  AcordaoDemand, RolResponsavel, ComissaoEticaDemand, SuperintendenciaRegional, 
  ComunicacaoDemand, CguDemand, CguPublishedReport,
  EticaMembro, EticaReuniao, EticaAta, EticaProcesso,
  Contrato, ContratoConsumoMensal, Viatura, ViaturaAbastecimento, ViaturaManutencao,
  UnidadeRol, Dirigente, DirigenteCargo, DirigenteEvento
} from "./src/types";
import { SEED_COMUNICACOES } from "./src/data/seed_comunicacoes";
import { SEED_CGU } from "./src/data/seed_cgu";
import { extractTcuDataNativo } from "./src/services/TcuNativeAgent";
import { 
  SEED_ETICA_MEMBROS, SEED_ETICA_REUNIOES, SEED_ETICA_ATAS, SEED_ETICA_PROCESSOS 
} from "./src/data/seed_etica";

// DB Path Definition
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "orbita_db.json");
const TCU_DIR = path.join(DATA_DIR, "tcu");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(TCU_DIR)) {
  fs.mkdirSync(TCU_DIR, { recursive: true });
}

// Initial High-Quality Mock/Seed Data in Portuguese (Brazilian Gov Pattern)
import * as Seeds from "./src/data/seed_db";

// NOTE: Users are now managed in PostgreSQL via userService.ts — not in mockUsers.


async function startServer() {
  const app = express();

  // Initialize PostgreSQL user table and migrate admin seed
  try {
    await initUsersTable();
  } catch (err) {
    console.error("[Server] Falha ao inicializar tabela de usuários. O servidor continuará, mas o login pode não funcionar.", err);
  }

  // Enable GZIP compression for all responses
  app.use(compression());

  // Set up session middleware
  app.use(session({
    store: new session.MemoryStore(),
    secret: process.env.SESSION_SECRET || "orbita-secret-key-123456789",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false, // set to true if using HTTPS
      httpOnly: true
    }
  }));

  // Session heartbeat expiration middleware to log out users on browser close
  app.use((req, res, next) => {
    if (req.session && req.session.user) {
      const now = Date.now();
      const isAuthRoute = req.path.startsWith("/api/auth");
      const shouldCheck = !isAuthRoute || req.path === "/api/auth/session";

      if (shouldCheck && req.session.lastHeartbeat) {
        const diff = now - req.session.lastHeartbeat;
        // If no heartbeat has been received for more than 2 minutes, expire the session.
        if (diff > 120000) {
          console.log(`[Orbita Session] Session expired due to lack of client heartbeat. Last seen: ${diff}ms ago.`);
          req.session.destroy(() => {});
          if (req.path.startsWith("/api/")) {
            return res.status(401).json({ authenticated: false, error: "Sessão encerrada por inatividade/fechamento do navegador." });
          } else {
            return res.redirect("/");
          }
        }
      }

      if (req.path !== "/api/auth/heartbeat") {
        req.session.lastHeartbeat = now;
      }
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // ==========================================
  // MIDDLEWARE DE SEGURANÇA — ADMIN
  // ==========================================
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.user || req.session.user.clearance !== "ADMIN") {
      return res.status(403).json({ error: "Acesso restrito a administradores." });
    }
    next();
  };

  // ==========================================
  // AUTENTICAÇÃO E GOV.BR AUTH API
  // ==========================================

  // Auth API: Get current session user
  app.get("/api/auth/session", async (req, res) => {
    if (req.session && req.session.user) {
      try {
        const freshUser = await findUserByIdentifier(req.session.user.id);
        if (freshUser && freshUser.status === "ACTIVE") {
          req.session.user = userToSessionFormat(freshUser) as any;
        }
      } catch (e) { /* mantém sessão existente se DB falhar */ }
      return res.json({ authenticated: true, user: req.session.user });
    }
    return res.json({ authenticated: false });
  });

  // Auth API: Heartbeat to keep session alive
  app.post("/api/auth/heartbeat", (req, res) => {
    if (req.session && req.session.user) {
      req.session.lastHeartbeat = Date.now();
      return res.json({ success: true });
    }
    return res.json({ success: false });
  });

  // Auth API: Login with PIN (fallback/simulação)
  app.post("/api/auth/login-pin", (req, res) => {
    const { profileId, pin } = req.body;
    if (!profileId || !pin) {
      return res.status(400).json({ error: "Perfil e PIN são obrigatórios." });
    }
    const matchedProfile = Seeds.SEED_PROFILES.find((p: any) => p.id === profileId);
    if (!matchedProfile) {
      return res.status(404).json({ error: "Perfil não encontrado." });
    }
    if (matchedProfile.pin === pin || matchedProfile.clearance === "PUBLIC") {
      req.session.user = {
        id: matchedProfile.id, name: matchedProfile.name, role: matchedProfile.role,
        email: matchedProfile.email, register: matchedProfile.register,
        clearance: matchedProfile.clearance, avatarColor: matchedProfile.avatarColor,
        badgeText: matchedProfile.badgeText
      } as any;
      return res.json({ success: true, user: req.session.user });
    }
    return res.status(401).json({ error: "Código PIN de assinatura inválido para este perfil." });
  });

  // Auth API: Login with local credentials (bcrypt + PostgreSQL)
  app.post("/api/auth/login-local", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identificador e senha são obrigatórios." });
    }
    const cleanId = String(identifier).replace(/\D/g, "");
    const maskedId = cleanId.length >= 6
      ? `${cleanId.substring(0, 3)}***${cleanId.slice(-2)}`
      : "***";
    console.log(`[Auth] Login attempt — identifier: ${maskedId}`);
    try {
      const user = await findUserByIdentifier(identifier);
      if (!user) {
        console.log(`[Auth] Login failed — user not found: ${maskedId}`);
        return res.status(401).json({ error: "Credenciais inválidas. Verifique o CPF e a senha informados." });
      }
      if (user.status !== "ACTIVE") {
        return res.status(403).json({ error: "Usuário não está ativo (status: " + user.status + ")." });
      }
      const valid = await verifyPassword(user, password);
      if (!valid) {
        console.log(`[Auth] Login failed — wrong password for user: ${user.id}`);
        return res.status(401).json({ error: "Credenciais inválidas. Senha incorreta." });
      }
      console.log(`[Auth] Login OK — user: ${user.id}`);
      req.session.user = userToSessionFormat(user) as any;
      return res.json({
        success: true,
        user: req.session.user,
        requiresPasswordChange: user.requires_password_change,
      });
    } catch (err) {
      console.error("[Auth] Erro no login:", err);
      return res.status(500).json({ error: "Erro interno ao processar login." });
    }
  });

  // Auth API: Request Access (PostgreSQL + e-mail ao admin)
  app.post("/api/auth/request-access", async (req, res) => {
    const { name, cpf, siape, phone, email, role, unidade, unidadeSigla, justificativa } = req.body;
    if (!name || !cpf || !email) {
      return res.status(400).json({ error: "Nome, CPF e E-mail são obrigatórios." });
    }
    try {
      const exists = await userExistsByEmailOrCpf(email, cpf);
      if (exists) {
        return res.status(400).json({ error: "Já existe um cadastro com este E-mail ou CPF." });
      }
      const newUser = await createPendingUser({ name, cpf, siape, phone, email, role, unidade, unidadeSigla, justificativa });
      // Notificar admin por e-mail
      sendAccessRequestNotification({ name, email, cpf, siape, role, unidade, justificativa }).catch(e =>
        console.error("[Email] Falha ao notificar admin:", e)
      );
      return res.json({ success: true, message: "Solicitação enviada com sucesso. O administrador será notificado." });
    } catch (err) {
      console.error("[Auth] Erro ao solicitar acesso:", err);
      return res.status(500).json({ error: "Erro ao registrar solicitação de acesso." });
    }
  });

  // Auth API: Forgot Password (CPF + SIAPE — duplo fator)
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { cpf, siape } = req.body;
    const genericMsg = "Se os dados estiverem corretos, um e-mail será enviado em instantes.";
    if (!cpf || !siape) {
      return res.json({ success: true, message: genericMsg });
    }
    try {
      const user = await findUserBySiapeAndCpf(siape, cpf);
      if (!user) {
        return res.json({ success: true, message: genericMsg });
      }
      const tempPass = generateTempPassword();
      await setProvisionalPassword(user.id, tempPass);
      sendPasswordResetEmail({ name: user.name, email: user.email }, tempPass).catch(e =>
        console.error("[Email] Falha ao enviar e-mail de recuperação:", e)
      );
      return res.json({ success: true, message: genericMsg });
    } catch (err) {
      console.error("[Auth] Erro ao recuperar senha:", err);
      return res.json({ success: true, message: genericMsg });
    }
  });

  // Auth API: Reset Password — troca obrigatória no primeiro acesso (bcrypt)
  app.post("/api/auth/reset-password", async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ error: "Não autenticado." });
    const { userId, oldPassword, newPassword } = req.body;
    if (req.session.user.id !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    try {
      const user = await findUserByIdentifier(userId);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
      const valid = await verifyPassword(user, oldPassword);
      if (!valid) return res.status(403).json({ error: "Senha atual incorreta." });
      await updatePassword(userId, newPassword);
      return res.json({ success: true, message: "Senha atualizada com sucesso." });
    } catch (err) {
      console.error("[Auth] Erro ao resetar senha:", err);
      return res.status(500).json({ error: "Erro interno ao atualizar senha." });
    }
  });

  // Admin API: List Users (requer ADMIN)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await listAllUsers();
      // Remove password_hash antes de enviar ao frontend
      return res.json(users.map(u => { const { password_hash, ...safe } = u; return safe; }));
    } catch (err) {
      return res.status(500).json({ error: "Erro ao listar usuários." });
    }
  });

  // Admin API: Approve User (requer ADMIN) + e-mail ao usuário
  app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    const { role, clearance, badgeText, allowedModules } = req.body;
    const adminId = (req.session as any).user.id;
    try {
      const tempPass = generateTempPassword();
      const updated = await approveUser(
        req.params.id,
        { role, clearance: clearance || "PUBLIC", badgeText, allowedModules },
        adminId,
        tempPass
      );
      sendAccessApprovedEmail(
        { name: updated.name, email: updated.email, cpf: updated.cpf, unidade: updated.unidade, badgeText: updated.badge_text },
        tempPass
      ).catch(e => console.error("[Email] Falha ao enviar aprovação:", e));
      const { password_hash, ...safe } = updated;
      return res.json({ success: true, user: safe });
    } catch (err) {
      console.error("[Admin] Erro ao aprovar usuário:", err);
      return res.status(500).json({ error: "Erro ao aprovar usuário." });
    }
  });

  // Admin API: Update active user data and permissions (requer ADMIN)
  app.post("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const { badgeText, allowedModules, clearance, role, name, email, siape, unidade } = req.body;
    try {
      const user = await findUserByIdentifier(req.params.id);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
      
      const updated = await updateUser(
        req.params.id,
        { role, clearance, badgeText, allowedModules, name, email, siape, unidade }
      );
      
      const { password_hash, ...safe } = updated;
      return res.json({ success: true, user: safe });
    } catch (err) {
      console.error("[Admin] Erro ao atualizar usuário:", err);
      return res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
  });

  // Admin API: Inactivate User (requer ADMIN)
  app.post("/api/admin/users/:id/inactivate", requireAdmin, async (req, res) => {
    try {
      await inactivateUser(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao inativar usuário." });
    }
  });

  // Admin API: Reactivate User (requer ADMIN)
  app.post("/api/admin/users/:id/reactivate", requireAdmin, async (req, res) => {
    try {
      await reactivateUser(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao reativar usuário." });
    }
  });

  // Auth API: Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Erro ao encerrar sessão." });
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  // Auth API: gov.br login redirect
  app.get("/api/auth/govbr/login", (req, res) => {
    const state = Math.random().toString(36).substring(2);
    if (process.env.GOVBR_CLIENT_ID) {
      const authUrl = `${process.env.GOVBR_SSO_URL || "https://sso.staging.acesso.gov.br"}/authorize?` +
        `response_type=code&` +
        `client_id=${process.env.GOVBR_CLIENT_ID}&` +
        `scope=openid+profile+email&` +
        `redirect_uri=${encodeURIComponent(process.env.GOVBR_REDIRECT_URI || "http://localhost:3000/api/auth/govbr/callback")}&` +
        `state=${state}`;
      return res.redirect(authUrl);
    }

    // Default simulator fallback
    return res.redirect(`/govbr-login-simulator?state=${state}`);
  });

  // Serve beautiful interactive gov.br login simulator page
  app.get("/govbr-login-simulator", (req, res) => {
    const { state } = req.query;
    const profilesHTML = Seeds.SEED_PROFILES.map(p => `
      <div class="profile-card border border-slate-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-[#1351b4] hover:bg-slate-50 transition duration-150" onclick="selectProfile('${p.id}', '${p.name}', '${p.role}', '${p.clearance}')">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white ${p.avatarColor.includes('bg-[') ? 'bg-[#1351b4]' : p.avatarColor}">
            ${p.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
          </div>
          <div>
            <h4 class="font-extrabold text-slate-800 text-sm">${p.name}</h4>
            <p class="text-xs text-slate-500">${p.role}</p>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">${p.badgeText}</span>
      </div>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SSO gov.br - Identificação de Serviços Públicos</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;850&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; }
          .gov-blue-btn { background-color: #1351b4; }
          .gov-blue-btn:hover { background-color: #0c3c88; }
        </style>
      </head>
      <body class="bg-slate-50 min-h-screen flex flex-col justify-between">
        <!-- Gov Header -->
        <header class="bg-white border-b border-slate-200 py-3 shadow-sm">
          <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black tracking-tight text-[#1351b4]">gov<span class="text-[#00c010]">.</span>br</span>
              <span class="text-xs text-slate-400 font-bold border-l border-slate-200 pl-2">Serviço de Autenticação Federada</span>
            </div>
            <span class="text-xs text-slate-500">Órgão Receptor: <strong class="text-slate-700">AECI/MTE - ÓRBITA</strong></span>
          </div>
        </header>

        <!-- Main Form -->
        <main class="max-w-md mx-auto w-full my-auto px-4 py-8">
          <div class="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">Identifique-se no gov.br</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              O Portal ÓRBITA solicita autenticação de identidade oficial para assinatura digital de auditoria.
            </p>

            <form action="/api/auth/govbr/callback" method="GET" class="mt-6 space-y-5" id="ssoForm">
              <input type="hidden" name="state" value="${state || ''}">
              <input type="hidden" name="profileId" id="profileId" value="">
              
              <div class="space-y-3" id="profileSelectionContainer">
                <label class="text-xs font-black text-slate-700 uppercase tracking-wider block">Escolha sua Persona Funcional (Simulação gov.br):</label>
                <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  ${profilesHTML}
                </div>
              </div>

              <!-- CPF Field -->
              <div class="space-y-1.5 hidden" id="cpfContainer">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-black text-slate-700 uppercase tracking-wider block">CPF do Servidor:</label>
                  <button type="button" class="text-xs text-[#1351b4] font-bold hover:underline" onclick="goBack()">Alterar Cargo</button>
                </div>
                <div class="relative">
                  <input type="text" id="cpfInput" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold tracking-wider bg-slate-50 focus:border-[#1351b4] focus:ring-1 focus:ring-[#1351b4] focus:outline-none" readonly>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                  <p class="text-[11px] text-amber-700 font-medium leading-normal">
                    📌 <strong>Simulador OIDC / PKCE Integrado</strong>
                    <span class="block mt-0.5 font-normal text-slate-600">Ao clicar em 'Autorizar Acesso', o servidor do ÓRBITA receberá o token JWT criptografado da identidade selecionada.</span>
                  </p>
                </div>
              </div>

              <button type="submit" id="submitBtn" class="w-full gov-blue-btn text-white py-3 rounded-2xl font-black text-sm transition duration-150 cursor-not-allowed shadow-md shadow-blue-200" disabled>
                Entrar com gov.br
              </button>
            </form>
          </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row gap-2 justify-between items-center">
            <span>© Secretaria de Governo Digital — Ministério da Gestão e da Inovação em Serviços Públicos</span>
            <div class="flex gap-4">
              <a href="#" class="hover:underline">Termos de uso</a>
              <a href="#" class="hover:underline">Privacidade</a>
            </div>
          </div>
        </footer>

        <script>
          function selectProfile(id, name, role, clearance) {
            document.getElementById('profileId').value = id;
            
            let mockCPF = "000.000.000-00";
            if (id === "alessandro") mockCPF = "416.526.491-15";
            
            document.getElementById('cpfInput').value = mockCPF;
            
            document.getElementById('profileSelectionContainer').classList.add('hidden');
            document.getElementById('cpfContainer').classList.remove('hidden');
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.classList.remove('cursor-not-allowed');
            submitBtn.innerHTML = "Autorizar Acesso como " + name.split(" ")[0];
          }

          function goBack() {
            document.getElementById('profileSelectionContainer').classList.remove('hidden');
            document.getElementById('cpfContainer').classList.add('hidden');
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.classList.add('cursor-not-allowed');
            submitBtn.innerHTML = "Entrar com gov.br";
          }
        </script>
      </body>
      </html>
    `;
    return res.send(html);
  });

  // Auth API: gov.br callback
  app.get("/api/auth/govbr/callback", (req, res) => {
    const { profileId } = req.query;
    const matchedProfile = Seeds.SEED_PROFILES.find(p => p.id === profileId) || Seeds.SEED_PROFILES[0];

    req.session.user = {
      id: matchedProfile.id,
      name: matchedProfile.name,
      role: matchedProfile.role,
      email: matchedProfile.email,
      register: matchedProfile.register,
      clearance: matchedProfile.clearance,
      avatarColor: matchedProfile.avatarColor,
      badgeText: matchedProfile.badgeText
    };

    return res.redirect("/");
  });

  // API 1: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "ORBITA.AECI", localTime: new Date().toISOString() });
  });
  // Register PostgreSQL Routes
  app.use("/api", acordaoRoutes);
  app.use("/api", comunicacoesRoutes);
  app.use("/api", tceRoutes);
app.use("/api", eticaRoutes);
app.use("/api", scdpRoutes);
  app.use("/api", cguRoutes);
  app.use("/api", cguAuditoriasRoutes);
  app.use("/api", superintendenciasRoutes);
  app.use("/api", contratosRoutes);
  app.use("/api", viaturasRoutes);
  app.use("/api/rol-responsaveis", rolLegacyRoutes);
  app.use("/api/rol", rolRoutes);
  app.use("/api", dashboardRoutes);

  // API 2: Acórdãos TCU - GET & CRUD (Legacy Fallbacks)
  
  
  

  

  
  

  

  
  

  
  

  
  

  

  

  
  

  

  
  
  
  
  

  

  

  
  

  

  

  
  

  // ==========================================
  // API GESTÃO DE CONTRATOS (SRTE)
  // ==========================================
  

  

  

  

  

  

  

  

  // ==========================================
  // API GESTÃO DE FROTA (SRTE)
  // ==========================================
  

  

  

  

  

  

  

  

  

  // ==========================================
  // API ROL DE RESPONSÁVEIS (IN 84/2020 TCU)
  // ==========================================

  // --- Unidades ---
  

  

  

  
  

  

  

  
  

  

  

  
  

  

  
  // Agendamento Semanal (7 dias = 604800000 ms) para importar Auditorias CGU
  setInterval(() => {
    runImportCguAuditorias("SISTEMA_AGENDADO").catch(console.error);
  }, 604800000);

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with compiled assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ORBITA.AECI server is running successfully on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting ORBITA.AECI Express backend:", err);
});
