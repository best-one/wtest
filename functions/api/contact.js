/**
 * POST /api/contact — Cloudflare Pages Function (edge Workers runtime)
 * Route comes from the file path: functions/api/contact.js → /api/contact
 *
 * Environment variables (Pages Dashboard → Settings → Environment variables; .dev.vars locally):
 *   TURNSTILE_SECRET_KEY  Secret  required in production; the Turnstile widget's Secret Key
 *   SKIP_TURNSTILE        Var     local debugging only, set "1" to bypass verification
 *   RESEND_API_KEY        Secret  optional, enables Resend email notifications
 *   SMTP_HOST             Var     optional, e.g. smtp.exmail.qq.com / smtp.aliyun.com
 *   SMTP_PORT             Var     465 (ssl, default) or 587 (starttls); port 25 is blocked
 *   SMTP_USER             Var     full mailbox address
 *   SMTP_PASS             Secret  SMTP password / 授权码（不是登录密码）
 *   SMTP_SECURE           Var     ssl | starttls | none(local test only)
 *   MAIL_FROM             Var     sender; must be the SMTP account's own address
 *   MAIL_TO               Var     notification recipient (WP 原站: janjung@betterlaser.tech)
 *   THANK_YOU_PATH        Var     optional success redirect, defaults to /thank-you/
 *
 * Bindings (Dashboard → Settings → Functions):
 *   DB      D1 database   optional, writes to contact_submissions (see schema.sql)
 *   EMAIL   send_email    optional, Cloudflare Email Service notifications
 *
 * The hidden "source" field carries ?ref=<slug> from product / CTA links so
 * every inquiry records which page or product it came from.
 *
 * WordPress 备份对照（wp_postmeta _elementor_data）:
 *   首页 #680 表单  submit_actions = save-to-database / email / redirect
 *                   email_to = janjung@betterlaser.tech
 *                   email_subject = 老大，激光耗材着陆页底部来询盘了
 *                   redirect_to = https://laserconsums.com/thank-you/
 *   弹窗 #901 表单  email_to = janjung@betterlaser.com.cn（laserlens 落地页同一套）
 *   字段            name / email(required) / message —— 与本端点完全一致
 *   自动回复模板    "Hi, [name], thank you for inquiring about our product..."
 *                   （如需恢复，在 Resend 投递层加第二封邮件，勿在本端点硬编码）
 *
 * Note: Cloudflare has no built-in form-capture product. The free MailChannels
 * Pages Plugin used by older tutorials was discontinued on 2024-06-30.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const LIMITS = { name: 100, email: 254, message: 5000, source: 120 };

const clean = (value, max) => String(value ?? "").trim().slice(0, max);
const headerSafe = (value) => String(value ?? "").replace(/[\r\n]+/g, " ").trim();

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const wantsJson = (request) =>
  (request.headers.get("accept") || "").includes("application/json") ||
  request.headers.get("x-requested-with") === "fetch";

/** fetch callers get structured JSON; native form POSTs get a 303 to the WP-compatible thank-you page. */
function reply(request, ok, payload, status, env) {
  if (wantsJson(request)) return json(payload, status);
  if (ok) {
    const thanks = String(env?.THANK_YOU_PATH || "/thank-you/");
    return new Response(null, { status: 303, headers: { location: thanks } });
  }
  return new Response(payload.error || "Submission failed", {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Same-origin check; ALLOWED_ORIGINS can whitelist extra hosts. */
function originAllowed(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  if (originHost === new URL(request.url).host) return true;
  const extras = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return extras.some((entry) => {
    try {
      return new URL(entry).host === originHost;
    } catch {
      return false;
    }
  });
}

/** Turnstile Siteverify — the front-end widget result alone is not trustworthy. */
async function verifyTurnstile(request, env, form) {
  if (env.SKIP_TURNSTILE === "1") return { ok: true, skipped: true };

  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, error: "TURNSTILE_SECRET_KEY is not configured" };

  const token = clean(form.get("cf-turnstile-response"), 2048);
  if (!token) return { ok: false, error: "Missing verification token. Please reload the page." };

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) body.append("remoteip", ip);

  const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
  if (!res.ok) return { ok: false, error: "Verification service unavailable. Please try again." };

  const result = await res.json();
  if (result.success !== true) return { ok: false, error: "Verification failed. Please try again." };
  return { ok: true };
}

/** Persist first: if storage fails, return 500 rather than losing the lead. */
async function persist(env, data, request) {
  if (!env.DB) return "none";
  await env.DB.prepare(
    `INSERT INTO contact_submissions (name, email, message, source, ip, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      data.name,
      data.email,
      data.message,
      data.source,
      request.headers.get("cf-connecting-ip") || "",
      clean(request.headers.get("user-agent"), 500),
      new Date().toISOString()
    )
    .run();
  return "d1";
}

/* ------------------------------------------------------------------ *
 * SMTP (optional)
 *
 * Workers 运行时没有 SMTP 客户端，也没有 Node 的 net；出站 TCP 只能走
 * cloudflare:sockets（connect）。所以这里手写最小可用的 SMTP 会话：
 *   220 → EHLO → [STARTTLS → EHLO] → AUTH LOGIN/PLAIN → MAIL → RCPT → DATA → QUIT
 * Cloudflare 全平台封 25 端口，只能用 465（隐式 TLS）或 587（STARTTLS）。
 * ------------------------------------------------------------------ */

const addrOf = (value) => {
  const m = /<([^>]+)>/.exec(String(value || ""));
  return (m ? m[1] : String(value || "")).trim();
};

const b64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

/** RFC 2047 encoded-word：中文主题与显示名必须编码，否则服务器会拒收或乱码。 */
const mimeWord = (str) => {
  const s = String(str || "");
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`;
};

const wrap76 = (s) => s.replace(/(.{76})/g, "$1\r\n");

function buildMime({ from, to, replyTo, subject, text }) {
  const head = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${mimeWord(subject)}`,
    replyTo ? `Reply-To: ${replyTo}` : "",
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ].filter(Boolean);
  return head.join("\r\n") + "\r\n\r\n" + wrap76(b64(text));
}

/** 行协议读取器：一次 read 可能拿到半个响应，必须按 "ddd␠" 判终结。 */
class SmtpSession {
  constructor(socket) {
    this.socket = socket;
    this.buf = "";
    this.decoder = new TextDecoder();
  }

  async bind() {
    this.reader = this.socket.readable.getReader();
    this.writer = this.socket.writable.getWriter();
    this.encoder = new TextEncoder();
  }

  async readReply() {
    for (;;) {
      const lines = this.buf.split("\r\n");
      let acc = 0;
      let code = 0;
      let end = -1;
      // 只处理完整行（最后一个元素可能是半行）
      for (let i = 0; i < lines.length - 1; i++) {
        const m = /^(\d{3})([ -])/.exec(lines[i]);
        if (!m) break;
        acc += lines[i].length + 2;
        if (m[2] === " ") {
          code = Number(m[1]);
          end = acc;
          break;
        }
      }
      if (end >= 0) {
        const raw = this.buf.slice(0, end);
        this.buf = this.buf.slice(end);
        return { code, raw };
      }
      const { value, done } = await this.reader.read();
      if (done) throw new Error("SMTP connection closed: " + this.buf.trim().slice(0, 160));
      this.buf += this.decoder.decode(value, { stream: true });
    }
  }

  async cmd(line, expect) {
    await this.writer.write(this.encoder.encode(line + "\r\n"));
    const res = await this.readReply();
    if (expect && !expect.includes(res.code)) {
      throw new Error(
        `SMTP ${line.split(" ")[0]} expected ${expect.join("/")} got ${res.code}: ${res.raw.trim().slice(0, 160)}`
      );
    }
    return res;
  }

  async startTls() {
    this.socket = this.socket.startTls();
    this.buf = "";
    await this.bind();
  }

  async close() {
    try {
      await this.writer.write(this.encoder.encode("QUIT\r\n"));
    } catch {}
    try {
      await this.socket.close();
    } catch {}
  }
}

/**
 * 发一封信。SMTP_SECURE:
 *   ssl       隐式 TLS（465，默认）
 *   starttls  先明文再升级（587）
 *   none      明文（仅本地自测用）
 */
async function sendViaSmtp(env, { subject, text, replyTo }) {
  const host = String(env.SMTP_HOST || "").trim();
  const port = Number(env.SMTP_PORT || 465);
  const user = String(env.SMTP_USER || "");
  const pass = String(env.SMTP_PASS || "");
  const from = String(env.MAIL_FROM || "");
  const fromAddr = addrOf(from);
  const rcpts = String(env.MAIL_TO || "")
    .split(/[,;]/)
    .map(addrOf)
    .filter(Boolean);

  if (!host || !user || !pass || !fromAddr || !rcpts.length) {
    throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASS / MAIL_FROM / MAIL_TO incomplete");
  }

  const mode = String(env.SMTP_SECURE || (port === 465 ? "ssl" : "starttls")).toLowerCase();
  const { connect } = await import("cloudflare:sockets");
  const socket = connect(
    { hostname: host, port },
    { secureTransport: mode === "ssl" ? "on" : mode === "none" ? "off" : "starttls" }
  );

  const s = new SmtpSession(socket);
  try {
    await s.bind();
    const greeting = await s.readReply();
    if (greeting.code !== 220) {
      throw new Error(`SMTP greeting ${greeting.code}: ${greeting.raw.trim().slice(0, 160)}`);
    }

    const helo = fromAddr.split("@")[1] || "localhost";
    await s.cmd(`EHLO ${helo}`, [250]);

    if (mode === "starttls") {
      await s.cmd("STARTTLS", [220]);
      await s.startTls();
      await s.cmd(`EHLO ${helo}`, [250]);
    }

    // 优先 AUTH PLAIN：阿里邮箱（smtp.qiye.aliyun.com）的 AUTH LOGIN 会返回
    // 526 Authentication failure，但同一账号的 AUTH PLAIN 是通的；腾讯 / 163
    // 若不接受 PLAIN 再回落 LOGIN。
    try {
      await s.cmd(`AUTH PLAIN ${b64("\u0000" + user + "\u0000" + pass)}`, [235]);
    } catch (plainErr) {
      try {
        await s.cmd("AUTH LOGIN", [334]);
        await s.cmd(b64(user), [334]);
        await s.cmd(b64(pass), [235]);
      } catch (loginErr) {
        throw new Error(`SMTP AUTH failed (PLAIN: ${plainErr.message}; LOGIN: ${loginErr.message})`);
      }
    }

    await s.cmd(`MAIL FROM:<${fromAddr}>`, [250]);
    for (const rcpt of rcpts) await s.cmd(`RCPT TO:<${rcpt}>`, [250, 251]);
    await s.cmd("DATA", [354]);

    // base64 正文里不会出现以 "." 开头的行，无需 dot-stuffing
    const mime = buildMime({ from, to: rcpts.join(", "), replyTo, subject, text });
    await s.writer.write(s.encoder.encode(mime + "\r\n.\r\n"));
    const accepted = await s.readReply();
    if (accepted.code !== 250) {
      throw new Error(`SMTP DATA rejected ${accepted.code}: ${accepted.raw.trim().slice(0, 160)}`);
    }
  } finally {
    await s.close();
  }
}

/** Notification: Resend HTTP API, SMTP, or Cloudflare Email Service. Never blocks the submission. */
async function notify(env, data) {
  const subject = headerSafe(`New inquiry from ${data.name}`).slice(0, 200);
  const text = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Source: ${data.source || "-"}`,
    "",
    data.message,
  ].join("\n");

  if (env.RESEND_API_KEY && env.MAIL_FROM && env.MAIL_TO) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [env.MAIL_TO],
        reply_to: data.email,
        subject,
        text,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return "resend";
  }

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM && env.MAIL_TO) {
    await sendViaSmtp(env, { subject, text, replyTo: data.email });
    return "smtp";
  }

  if (env.EMAIL && env.MAIL_FROM && env.MAIL_TO) {
    await env.EMAIL.send({
      to: env.MAIL_TO,
      from: env.MAIL_FROM,
      replyTo: data.email,
      subject,
      text,
    });
    return "send_email";
  }

  return "none";
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "POST" },
    });
  }

  if (!originAllowed(request, env)) {
    return reply(request, false, { ok: false, error: "Request origin is not allowed" }, 403);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(request, false, { ok: false, error: "Unable to parse form data" }, 400);
  }

  // Honeypot hit: pretend success so bots get no signal
  if (clean(form.get("website"), 200) !== "") {
    return reply(request, true, { ok: true }, 200, env);
  }

  const data = {
    name: clean(form.get("name"), LIMITS.name),
    email: clean(form.get("email"), LIMITS.email),
    // The /contact/ page's original Elementor form collects Phone instead of Message.
    message: clean(
      form.get("message") || (form.get("phone") ? "Phone: " + form.get("phone") : ""),
      LIMITS.message
    ),
    source: clean(form.get("source"), LIMITS.source),
  };

  if (!data.name || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return reply(request, false, { ok: false, error: "Please provide a valid name, email and message" }, 400);
  }

  const turnstile = await verifyTurnstile(request, env, form);
  if (!turnstile.ok) {
    return reply(request, false, { ok: false, error: turnstile.error }, 400);
  }

  let stored = "none";
  try {
    stored = await persist(env, data, request);
  } catch (err) {
    console.error("[contact] persist failed", String(err));
    return reply(request, false, { ok: false, error: "Could not save your inquiry. Please try again." }, 500);
  }

  let notified = "none";
  try {
    notified = await notify(env, data);
  } catch (err) {
    console.error("[contact] notify failed", String(err));
  }

  // Without D1 / email configured, keep a structured record in the real-time log
  console.log("[contact] accepted", JSON.stringify({
    name: data.name,
    email: data.email,
    source: data.source,
    length: data.message.length,
    stored,
    notified,
    turnstile: turnstile.skipped ? "skipped" : "verified",
  }));

  return reply(request, true, { ok: true }, 200, env);
}
