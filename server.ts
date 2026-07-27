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
import superintendenciasRoutes from "./src/backend/routes/superintendenciasRoutes.js";
import contratosRoutes from "./src/backend/routes/contratosRoutes.js";
import viaturasRoutes from "./src/backend/routes/viaturasRoutes.js";
import rolLegacyRoutes from "./src/backend/routes/rolLegacyRoutes.js";
import dashboardRoutes from "./src/backend/routes/dashboardRoutes.js";
import { pool } from "./src/backend/db";
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



let mockUsers: any[] = [...Seeds.SEED_PROFILES];


async function startServer() {
  const app = express();
  
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
  // AUTENTICAÇÃO E GOV.BR AUTH API
  // ==========================================

  // Auth API: Get current session user
  app.get("/api/auth/session", (req, res) => {
    if (req.session && req.session.user) {
      // Fetch fresh data from db to ensure permissions are up to date
      const data = { users: mockUsers };
      const freshUser = (data.users || []).find((u: any) => u.id === req.session.user.id);
      
      if (freshUser) {
        // Update session with fresh data
        req.session.user = {
          id: freshUser.id,
          name: freshUser.name,
          role: freshUser.role,
          email: freshUser.email,
          register: freshUser.register,
          clearance: freshUser.clearance,
          avatarColor: freshUser.avatarColor,
          badgeText: freshUser.badgeText,
          allowedModules: freshUser.allowedModules
        };
      }
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

  // Auth API: Login with PIN (local/fallback)
  app.post("/api/auth/login-pin", (req, res) => {
    const { profileId, pin } = req.body;
    if (!profileId || !pin) {
      return res.status(400).json({ error: "Perfil e PIN são obrigatórios." });
    }

    const matchedProfile = Seeds.SEED_PROFILES.find(p => p.id === profileId);
    if (!matchedProfile) {
      return res.status(404).json({ error: "Perfil não encontrado." });
    }

    if (matchedProfile.pin === pin || matchedProfile.clearance === "PUBLIC") {
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
      return res.json({ success: true, user: req.session.user });
    } else {
      return res.status(401).json({ error: "Código PIN de assinatura inválido para este perfil." });
    }
  });

  // Auth API: Login with local credentials (new flow)
  app.post("/api/auth/login-local", (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identificador e senha são obrigatórios." });
    }

    const data = { users: mockUsers };
    const users = data.users || [];
    
    // Find by exact email or exact CPF (numbers only) or exact id
    const cleanId = String(identifier || "").replace(/\D/g, "");
    console.log(`[Login Info] Incoming identifier: "${identifier}", cleanId: "${cleanId}", password: "${password}"`);
    
    const matchedProfile = users.find((p: any) => 
      p.email === identifier || p.id === identifier || (p.cpf && p.cpf.replace(/\D/g, "") === cleanId)
    );

    if (!matchedProfile) {
      console.log(`[Login Error] No matched profile for identifier: "${identifier}"`);
      return res.status(404).json({ error: `Credenciais inválidas. CPF/Login não localizado no banco: ${cleanId}` });
    }

    console.log(`[Login Info] Matched user: "${matchedProfile.id}" (CPF: "${matchedProfile.cpf}", status: "${matchedProfile.status}")`);

    if (matchedProfile.status && matchedProfile.status !== "ACTIVE") {
      return res.status(403).json({ error: "Usuário não está ativo (status: " + matchedProfile.status + ")." });
    }

    // fallback to pin if password not set (for old mock profiles)
    const validPassword = matchedProfile.password || matchedProfile.pin;
    
    if (validPassword === password || matchedProfile.clearance === "PUBLIC") {
      req.session.user = {
        id: matchedProfile.id,
        name: matchedProfile.name,
        role: matchedProfile.role,
        email: matchedProfile.email,
        register: matchedProfile.register,
        clearance: matchedProfile.clearance,
        avatarColor: matchedProfile.avatarColor,
        badgeText: matchedProfile.badgeText,
        allowedModules: matchedProfile.allowedModules
      };
      return res.json({ 
        success: true, 
        user: req.session.user, 
        requiresPasswordChange: matchedProfile.requiresPasswordChange || false 
      });
    } else {
      return res.status(401).json({ error: `Credenciais inválidas. Senha incorreta para o usuário: ${matchedProfile.id}` });
    }
  });

  // Auth API: Request Access
  app.post("/api/auth/request-access", (req, res) => {
    const { name, cpf, phone, email, unidade } = req.body;
    if (!name || !cpf || !email) {
      return res.status(400).json({ error: "Nome, CPF e E-mail são obrigatórios." });
    }
    
    const data = { users: mockUsers };
    data.users = data.users || [];
    
    // Check if exists
    const cleanCpf = cpf.replace(/\D/g, "");
    const exists = data.users.find((p:any) => p.email === email || (p.cpf && p.cpf.replace(/\D/g, "") === cleanCpf));
    if (exists) {
      return res.status(400).json({ error: "Usuário com este E-mail ou CPF já está cadastrado." });
    }

    const newUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name,
      cpf,
      phone,
      unidade,
      email,
      role: "Acesso Solicitado",
      register: "Pendente",
      clearance: "PENDING",
      avatarColor: "bg-slate-300 text-slate-700 border-slate-300",
      pin: "0000",
      password: "",
      requiresPasswordChange: true,
      status: "PENDING",
      badgeText: "PENDENTE"
    };

    data.users.push(newUser);
    if (data.users) mockUsers = data.users;

    console.log(`[EMAIL SIMULATION] To: admins | Subject: Nova Solicitação de Acesso | Body: O usuário ${name} (${email}) solicitou acesso.`);

    return res.json({ success: true, message: "Solicitação enviada com sucesso." });
  });

  // Auth API: Forgot Password
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email, cpf } = req.body;
    
    const data = { users: mockUsers };
    const users = data.users || [];
    
    const cleanCpf = cpf ? cpf.replace(/\D/g, "") : "";
    const userIndex = users.findIndex((p:any) => p.email === email && p.cpf && p.cpf.replace(/\D/g, "") === cleanCpf);
    
    if (userIndex === -1) {
      // Return success anyway for security reasons (don't leak emails)
      return res.json({ success: true, message: "Se os dados estiverem corretos, um e-mail foi enviado." });
    }

    // Generate provisional password
    const provPass = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    data.users[userIndex].password = provPass;
    data.users[userIndex].requiresPasswordChange = true;
    if (data.users) mockUsers = data.users;

    console.log(`[EMAIL SIMULATION] To: ${email} | Subject: Recuperação de Senha | Body: Sua nova senha provisória é ${provPass}. Você deverá trocá-la no próximo acesso.`);

    return res.json({ success: true, message: "E-mail de recuperação enviado." });
  });

  // Auth API: Reset Password (after login)
  app.post("/api/auth/reset-password", (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    // In a real app, we check if req.session.user.id == userId
    
    const data = { users: mockUsers };
    const userIndex = (data.users || []).findIndex((p:any) => p.id === userId);
    
    if (userIndex === -1) return res.status(404).json({ error: "Usuário não encontrado." });
    
    const user = data.users[userIndex];
    if (user.password !== oldPassword && user.pin !== oldPassword) {
      return res.status(403).json({ error: "Senha atual incorreta." });
    }

    data.users[userIndex].password = newPassword;
    data.users[userIndex].requiresPasswordChange = false;
    data.users[userIndex].pin = newPassword; // keeping pin in sync for mock fallback
    if (data.users) mockUsers = data.users;

    return res.json({ success: true, message: "Senha atualizada com sucesso." });
  });

  // Admin API: List Users
  app.get("/api/admin/users", (req, res) => {
    // Should check clearance === ADMIN here
    const data = { users: mockUsers };
    return res.json(data.users || []);
  });

  // Admin API: Approve or Update User
  app.post("/api/admin/users/:id/approve", (req, res) => {
    const { role, clearance, badgeText, allowedModules } = req.body;
    const data = { users: mockUsers };
    const userIndex = (data.users || []).findIndex((p:any) => p.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ error: "Usuário não encontrado." });
    
    const isNewApproval = data.users[userIndex].status === "PENDING";
    let provPass = data.users[userIndex].password;

    if (isNewApproval) {
      provPass = Math.floor(100000 + Math.random() * 900000).toString();
      data.users[userIndex].password = provPass;
      data.users[userIndex].pin = provPass;
      data.users[userIndex].requiresPasswordChange = true;
    }
    
    data.users[userIndex].status = "ACTIVE";
    data.users[userIndex].role = role || data.users[userIndex].role;
    data.users[userIndex].clearance = clearance || "PUBLIC";
    data.users[userIndex].badgeText = badgeText || "AUTORIZADO";
    if (allowedModules) {
      data.users[userIndex].allowedModules = allowedModules;
    }
    
    if (data.users) mockUsers = data.users;

    if (isNewApproval) {
      console.log(`\n\n=== SIMULAÇÃO DE ENVIO DE E-MAIL ===\nPara: ${data.users[userIndex].email}\nAssunto: Acesso Aprovado\nMensagem: Seu acesso ao ÓRBITA.AECI foi aprovado.\nSua senha provisória é: ${provPass}\n====================================\n\n`);
    }

    return res.json({ success: true, user: data.users[userIndex] });
  });

  // Admin API: Update active user permissions
  app.post("/api/admin/users/:id", (req, res) => {
    const { badgeText, allowedModules } = req.body;
    const data = { users: mockUsers };
    const userIndex = (data.users || []).findIndex((p:any) => p.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ error: "Usuário não encontrado." });
    
    if (badgeText) data.users[userIndex].badgeText = badgeText;
    if (allowedModules) data.users[userIndex].allowedModules = allowedModules;
    
    if (data.users) mockUsers = data.users;
    return res.json({ success: true, user: data.users[userIndex] });
  });

  // Admin API: Inactivate User
  app.post("/api/admin/users/:id/inactivate", (req, res) => {
    const data = { users: mockUsers };
    const userIndex = (data.users || []).findIndex((p:any) => p.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ error: "Usuário não encontrado." });
    
    data.users[userIndex].status = "INACTIVE";
    if (data.users) mockUsers = data.users;

    return res.json({ success: true, user: data.users[userIndex] });
  });

  // Auth API: Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao encerrar sessão." });
      }
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
