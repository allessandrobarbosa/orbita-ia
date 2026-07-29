/**
 * emailService.ts
 * Serviço centralizado de envio de e-mails do ÓRBITA.AECI.
 * 
 * - Se SMTP_HOST estiver configurado no .env, envia e-mails reais via Nodemailer
 * - Caso contrário, opera em modo simulação: imprime HTML no console
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "alessandro.lourenco@trabalho.gov.br";
const SMTP_FROM   = process.env.SMTP_FROM || '"ÓRBITA.AECI" <noreply@trabalho.gov.br>';
const APP_URL     = process.env.APP_URL || "http://localhost:3000";

// ─────────────────────────────────────────────
// Transporter factory
// ─────────────────────────────────────────────
function createTransporter() {
  if (!process.env.SMTP_HOST) {
    return null; // modo simulação
  }
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }, // necessário para alguns exchanges gov
  });
}

// ─────────────────────────────────────────────
// Envio interno (real ou simulado)
// ─────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    // MODO SIMULAÇÃO — imprime o e-mail formatado no console
    console.log("\n" + "═".repeat(70));
    console.log(`📧  EMAIL SIMULADO (configure SMTP_HOST no .env para envio real)`);
    console.log("═".repeat(70));
    console.log(`Para:     ${to}`);
    console.log(`Assunto:  ${subject}`);
    console.log(`Remetente: ${SMTP_FROM}`);
    console.log("─".repeat(70));
    // Extrai texto legível do HTML para o console
    const text = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    console.log(text);
    console.log("═".repeat(70) + "\n");
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });

  console.log(`[Email] Enviado para: ${to} | Assunto: ${subject}`);
}

// ─────────────────────────────────────────────
// Template base gov.br
// ─────────────────────────────────────────────
function baseTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header gov.br -->
        <tr>
          <td style="background:linear-gradient(135deg,#1351b4 0%,#003366 100%);padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                    ÓRBITA<span style="color:#fbbf24;">.</span>AECI
                  </div>
                  <div style="font-size:10px;color:#93c5fd;font-weight:700;letter-spacing:2px;margin-top:2px;text-transform:uppercase;">
                    Assessoria Especial de Controle Interno — MTE
                  </div>
                </td>
                <td align="right">
                  <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:8px 14px;display:inline-block;">
                    <div style="font-size:18px;font-weight:900;color:#ffffff;">gov<span style="color:#00c010;">.</span>br</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Título -->
        <tr>
          <td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:20px 32px;">
            <h1 style="margin:0;font-size:16px;font-weight:800;color:#1e293b;letter-spacing:-0.3px;">${title}</h1>
          </td>
        </tr>

        <!-- Conteúdo -->
        <tr>
          <td style="padding:28px 32px;color:#334155;font-size:14px;line-height:1.7;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              Este é um e-mail automático do sistema ÓRBITA.AECI — Ministério do Trabalho e Emprego.<br>
              Não responda a este e-mail. Em caso de dúvidas, entre em contato com a AECI.
            </p>
            <p style="margin:8px 0 0;font-size:10px;color:#cbd5e1;">
              © 2026 República Federativa do Brasil
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Templates específicos
// ─────────────────────────────────────────────

/**
 * Notifica o administrador sobre uma nova solicitação de acesso.
 */
export async function sendAccessRequestNotification(user: {
  name: string;
  email: string;
  cpf?: string;
  siape?: string;
  role?: string;
  unidade?: string;
  justificativa?: string;
}): Promise<void> {
  const content = `
    <p>Uma nova solicitação de acesso ao <strong>ÓRBITA.AECI</strong> foi recebida e aguarda sua análise.</p>
    
    <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:16px 0;">
      <tr style="background:#f8fafc;">
        <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">
          Dados do Solicitante
        </td>
      </tr>
      ${row("Nome Completo", user.name)}
      ${row("E-mail", user.email)}
      ${row("CPF", user.cpf || "—")}
      ${row("SIAPE", user.siape || "—")}
      ${row("Cargo/Função", user.role || "—")}
      ${row("Unidade", user.unidade || "—")}
    </table>

    ${user.justificativa ? `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <div style="font-size:11px;font-weight:800;color:#78350f;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
        Justificativa de Acesso
      </div>
      <p style="margin:0;font-size:13px;color:#451a03;">${user.justificativa}</p>
    </div>` : ""}

    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}" 
         style="background:#1351b4;color:#ffffff;font-weight:800;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;letter-spacing:0.3px;">
        Abrir Painel do Administrador
      </a>
    </div>

    <p style="font-size:12px;color:#64748b;margin-top:16px;">
      Acesse o painel, vá em <strong>Administração e Usuários</strong> e aprove ou recuse a solicitação.
    </p>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `[ÓRBITA.AECI] Nova Solicitação de Acesso — ${user.name}`,
    baseTemplate("Nova Solicitação de Acesso", content)
  );
}

/**
 * Notifica o usuário que seu acesso foi aprovado, com a senha provisória.
 */
export async function sendAccessApprovedEmail(user: {
  name: string;
  email: string;
  cpf?: string;
  unidade?: string;
  badgeText?: string;
}, tempPassword: string): Promise<void> {
  const content = `
    <p>Olá, <strong>${user.name}</strong>!</p>
    <p>Sua solicitação de acesso ao sistema <strong>ÓRBITA.AECI</strong> foi <strong style="color:#16a34a;">aprovada</strong>.</p>

    <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center;">
      <div style="font-size:11px;font-weight:800;color:#14532d;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
        Senha Provisória de Acesso
      </div>
      <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:900;color:#1351b4;letter-spacing:3px;background:#ffffff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 20px;display:inline-block;">
        ${tempPassword}
      </div>
      <p style="margin:10px 0 0;font-size:12px;color:#166534;">
        ⚠️ Esta senha é <strong>provisória</strong> e deverá ser trocada no primeiro acesso.
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:16px 0;">
      <tr style="background:#f8fafc;">
        <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">
          Seus Dados de Acesso
        </td>
      </tr>
      ${row("Identificador de Login", user.cpf ? user.cpf.replace(/\D/g, "") : user.email)}
      ${row("Nível de Acesso", user.badgeText || "—")}
      ${row("Unidade", user.unidade || "—")}
    </table>

    <p><strong>Como acessar:</strong></p>
    <ol style="margin:0;padding-left:20px;color:#334155;font-size:13px;line-height:2;">
      <li>Acesse o sistema em <a href="${APP_URL}" style="color:#1351b4;">${APP_URL}</a></li>
      <li>Informe seu CPF no campo de identificação</li>
      <li>Use a senha provisória acima</li>
      <li>Você será solicitado a criar uma nova senha permanente</li>
    </ol>

    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#78350f;">
        🔒 <strong>Segurança:</strong> Nunca compartilhe sua senha. O ÓRBITA.AECI e a AECI jamais solicitarão sua senha por e-mail ou telefone.
      </p>
    </div>
  `;

  await sendEmail(
    user.email,
    "[ÓRBITA.AECI] Seu acesso foi aprovado — Senha Provisória",
    baseTemplate("Acesso ao ÓRBITA.AECI Aprovado", content)
  );
}

/**
 * Envia nova senha provisória após recuperação de senha.
 */
export async function sendPasswordResetEmail(user: {
  name: string;
  email: string;
}, tempPassword: string): Promise<void> {
  const content = `
    <p>Olá, <strong>${user.name}</strong>!</p>
    <p>Recebemos uma solicitação de recuperação de senha para sua conta no <strong>ÓRBITA.AECI</strong>.</p>

    <div style="background:#fff7ed;border:2px solid #fb923c;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center;">
      <div style="font-size:11px;font-weight:800;color:#7c2d12;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
        Nova Senha Provisória
      </div>
      <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:900;color:#1351b4;letter-spacing:3px;background:#ffffff;border:1px solid #fed7aa;border-radius:6px;padding:10px 20px;display:inline-block;">
        ${tempPassword}
      </div>
      <p style="margin:10px 0 0;font-size:12px;color:#9a3412;">
        ⚠️ Esta senha é <strong>provisória</strong> e deverá ser trocada no próximo acesso.
      </p>
    </div>

    <p style="font-size:13px;color:#475569;">
      Se você <strong>não solicitou</strong> a recuperação de senha, ignore este e-mail e sua senha anterior permanecerá ativa. Em caso de suspeita de acesso indevido, entre em contato com a AECI imediatamente.
    </p>

    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}" 
         style="background:#1351b4;color:#ffffff;font-weight:800;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">
        Acessar o Sistema
      </a>
    </div>
  `;

  await sendEmail(
    user.email,
    "[ÓRBITA.AECI] Recuperação de Senha — Senha Provisória",
    baseTemplate("Recuperação de Senha", content)
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function row(label: string, value: string): string {
  return `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#475569;width:40%;white-space:nowrap;">${label}</td>
      <td style="padding:10px 16px;font-size:13px;color:#1e293b;font-weight:500;">${value}</td>
    </tr>`;
}
