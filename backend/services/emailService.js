const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const LOG_DIR = path.join(__dirname, "../../docs/email-logs");
const LOG_FILE = path.join(LOG_DIR, "realtime_updates.log");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

// In-memory dispatch history for fast lookup/API
const dispatchHistory = [];

let transporter = null;

/**
 * Get or initialize nodemailer transporter
 */
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Development / Local transport: JSON or Ethereal fallback
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
}

/**
 * Format Readora email template
 */
function generateEmailHtml({ title, subtitle, contentHtml, actionUrl, actionText, recipientEmail, eventType }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF6F0; margin: 0; padding: 24px; color: #43281C; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(101, 36, 105, 0.12); box-shadow: 0 10px 30px rgba(101, 36, 105, 0.08); }
    .header { background: linear-gradient(135deg, #652469 0%, #4A1A4D 100%); padding: 28px; text-align: center; color: #FAF6F0; }
    .logo-badge { display: inline-block; background: rgba(201, 154, 61, 0.2); border: 1px solid #C99A3D; color: #F5E6C8; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 14px; border-radius: 999px; margin-bottom: 8px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .body { padding: 32px 28px; }
    .tag { display: inline-block; background: #F5E6C8; color: #652469; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 14px; }
    .title { font-size: 20px; font-weight: 700; color: #652469; margin: 0 0 10px 0; }
    .content { font-size: 14px; line-height: 1.6; color: #43281C; }
    .card-box { background: #FAF6F0; border-left: 4px solid #C99A3D; padding: 14px 18px; border-radius: 8px; margin: 18px 0; font-size: 13px; }
    .btn-container { text-align: center; margin: 28px 0 12px; }
    .btn { display: inline-block; background: #652469; color: #FAF6F0 !important; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 999px; box-shadow: 0 4px 12px rgba(101, 36, 105, 0.25); }
    .footer { background: #FAF6F0; border-top: 1px solid rgba(101, 36, 105, 0.08); padding: 20px 28px; text-align: center; font-size: 11px; color: #7F5539; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">✦ READORA LIVE SYNC ✦</div>
      <h1>Real-Time Reading Update</h1>
    </div>
    <div class="body">
      <span class="tag">⚡ WEBSOCKET EVENT: ${eventType || "REALTIME_UPDATE"}</span>
      <h2 class="title">${title}</h2>
      ${subtitle ? `<p style="color:#7F5539; font-size:13px; margin-top:-4px;">${subtitle}</p>` : ""}
      <div class="content">
        ${contentHtml}
      </div>
      ${
        actionUrl
          ? `<div class="btn-container">
              <a href="${actionUrl}" class="btn">${actionText || "Open Readora"} →</a>
            </div>`
          : ""
      }
    </div>
    <div class="footer">
      <p style="margin:0 0 6px 0;">This real-time notification was dispatched to your registered email: <strong>${recipientEmail}</strong></p>
      <p style="margin:0; opacity:0.8;">READORA — MERN Complete Reading Universe & Buddy Reads</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send real-time notification email
 */
async function sendRealtimeNotificationEmail({
  to,
  subject,
  title,
  subtitle = "",
  contentHtml,
  actionUrl = "http://localhost:5173/community",
  actionText = "Open in Readora",
  eventType = "REALTIME_NOTIFICATION",
  metadata = {},
}) {
  if (!to || !to.includes("@")) {
    console.warn(`[EmailService] Cannot send email: invalid recipient "${to}"`);
    return { success: false, reason: "invalid_email" };
  }

  const emailRecord = {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    to,
    subject: subject || `[Readora Real-Time] ${title}`,
    title,
    eventType,
    timestamp: new Date().toISOString(),
    metadata,
  };

  try {
    const t = await getTransporter();
    const html = generateEmailHtml({
      title,
      subtitle,
      contentHtml,
      actionUrl,
      actionText,
      recipientEmail: to,
      eventType,
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Readora Real-Time" <updates@readora.app>',
      to,
      subject: emailRecord.subject,
      html,
      text: `${title}\n\n${subtitle}\n\nDispatched to: ${to} via Readora Real-Time Sync.`,
    };

    const info = await t.sendMail(mailOptions);

    emailRecord.status = "DISPATCHED";
    emailRecord.messageId = info?.messageId || "simulated-id";

    // Save to in-memory dispatch history (keep last 100)
    dispatchHistory.unshift(emailRecord);
    if (dispatchHistory.length > 100) dispatchHistory.pop();

    // Append to file log for auditing and verification
    const logEntry = `[${emailRecord.timestamp}] [${eventType}] TO: ${to} | SUBJECT: "${emailRecord.subject}" | ID: ${emailRecord.messageId}\n`;
    fs.appendFileSync(LOG_FILE, logEntry, "utf8");

    console.log(`[EmailService ⚡] Real-time notification dispatched to registered email: ${to} (${eventType})`);
    return { success: true, record: emailRecord };
  } catch (err) {
    console.error(`[EmailService ❌] Error dispatching to ${to}:`, err.message);
    emailRecord.status = "FAILED";
    emailRecord.error = err.message;
    dispatchHistory.unshift(emailRecord);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch when a buddy read chat message is received
 */
async function notifyBuddyMessage({ recipientEmail, recipientName, senderName, buddyTitle, bookTitle, messageText, page }) {
  if (!recipientEmail) return;

  const pageInfo = page > 0 ? `(Referencing Page ${page})` : "";
  const contentHtml = `
    <p><strong>${senderName}</strong> posted a new message in your active Buddy Read <em>"${buddyTitle}"</em>:</p>
    <div class="card-box">
      <div style="font-size:11px; font-weight:bold; color:#652469; margin-bottom:4px;">
        💬 ${senderName} ${pageInfo}
      </div>
      <p style="margin:0; font-style:italic; color:#43281C;">"${messageText}"</p>
    </div>
    <p style="font-size:12px; color:#7F5539;">
      Book: <strong>${bookTitle || "Buddy Read Book"}</strong>
    </p>
  `;

  return sendRealtimeNotificationEmail({
    to: recipientEmail,
    subject: `[Readora Buddy Read] New message from ${senderName} in "${buddyTitle}"`,
    title: `New Message in ${buddyTitle}`,
    subtitle: `From reading partner ${senderName}`,
    contentHtml,
    eventType: "BUDDYREAD_MESSAGE",
    metadata: { senderName, buddyTitle, page },
  });
}

/**
 * Dispatch when a partner updates their reading progress
 */
async function notifyBuddyProgress({ recipientEmail, recipientName, partnerName, buddyTitle, bookTitle, currentPage, percentage, totalPages }) {
  if (!recipientEmail) return;

  const contentHtml = `
    <p>Your buddy reading partner <strong>${partnerName}</strong> just synchronized their reading progress in <em>"${buddyTitle}"</em>:</p>
    <div class="card-box">
      <div style="display:flex; justify-content:space-between; font-weight:bold; color:#652469; margin-bottom:6px;">
        <span>Progress: ${percentage}%</span>
        <span>Page ${currentPage} of ${totalPages || 300}</span>
      </div>
      <div style="background:rgba(101,36,105,0.1); height:8px; border-radius:999px; overflow:hidden;">
        <div style="background:#C99A3D; height:100%; width:${percentage}%; border-radius:999px;"></div>
      </div>
    </div>
    <p style="font-size:12px; color:#7F5539;">
      Catch up or discuss chapter developments with ${partnerName}!
    </p>
  `;

  return sendRealtimeNotificationEmail({
    to: recipientEmail,
    subject: `[Readora Buddy Read] ${partnerName} reached ${percentage}% in "${buddyTitle}"`,
    title: `${partnerName} made reading progress!`,
    subtitle: `${buddyTitle} • Page ${currentPage}`,
    contentHtml,
    eventType: "BUDDYREAD_PROGRESS",
    metadata: { partnerName, buddyTitle, currentPage, percentage },
  });
}

/**
 * Dispatch when a milestone or challenge checkpoint is reached
 */
async function notifyMilestoneUnlocked({ recipientEmail, recipientName, milestoneName, targetPage, bookTitle, buddyTitle }) {
  if (!recipientEmail) return;

  const contentHtml = `
    <p>Congratulations <strong>${recipientName}</strong>! You reached a major reading milestone:</p>
    <div class="card-box" style="border-left-color: #652469; background:#FAF6F0;">
      <div style="font-size:16px; font-weight:bold; color:#652469;">🏆 ${milestoneName}</div>
      <p style="margin:4px 0 0 0; font-size:12px; color:#7F5539;">
        Checkpoint Target: Page ${targetPage} in <em>${bookTitle || buddyTitle}</em>
      </p>
    </div>
    <p style="font-size:13px; color:#43281C;">
      Your reading streak and XP score have been credited. Keep the reading momentum going!
    </p>
  `;

  return sendRealtimeNotificationEmail({
    to: recipientEmail,
    subject: `[Readora Milestone] 🏆 You unlocked "${milestoneName}"!`,
    title: `Milestone Checkpoint Unlocked!`,
    subtitle: `${milestoneName} • Page ${targetPage}`,
    contentHtml,
    eventType: "CHALLENGE_MILESTONE",
    metadata: { milestoneName, targetPage, bookTitle },
  });
}

/**
 * Dispatch when a new follower follows the user
 */
async function notifyNewFollower({ recipientEmail, recipientName, followerName }) {
  if (!recipientEmail) return;

  const contentHtml = `
    <p>Hello <strong>${recipientName}</strong>,</p>
    <div class="card-box">
      <p style="margin:0; font-size:14px; color:#652469; font-weight:700;">
        ✨ <strong>${followerName}</strong> started following your reading universe!
      </p>
    </div>
    <p style="font-size:13px; color:#43281C;">
      They will now see your public reading activity, reviews, and buddy read invitations.
    </p>
  `;

  return sendRealtimeNotificationEmail({
    to: recipientEmail,
    subject: `[Readora Community] ${followerName} started following your reading profile! ✨`,
    title: `New Follower on Readora`,
    subtitle: `${followerName} joined your circle`,
    contentHtml,
    eventType: "FOLLOW_NEW",
    metadata: { followerName },
  });
}

/**
 * Dispatch 6-digit OTP verification email for login/registration
 */
async function sendOtpEmail({ to, otp, userName = "Reader" }) {
  if (!to) return;

  const contentHtml = `
    <p>Hello <strong>${userName}</strong>,</p>
    <p>Your one-time login verification code for Readora is:</p>
    <div style="text-align:center; padding:20px; background:#FAF6F0; border-radius:12px; margin:20px 0; border:2px dashed #C99A3D;">
      <span style="font-size:32px; font-weight:800; letter-spacing:8px; color:#652469; font-family:monospace;">
        ${otp}
      </span>
    </div>
    <p style="font-size:12px; color:#7F5539; text-align:center;">
      This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
    </p>
  `;

  console.log(`\n======================================================`);
  console.log(`[OTP DISPATCH ⚡] TO: ${to} | CODE: [${otp}]`);
  console.log(`======================================================\n`);

  return sendRealtimeNotificationEmail({
    to,
    subject: `[Readora Security] Your One-Time Login Code: ${otp} ✦`,
    title: `Your Readora Verification Code`,
    subtitle: `Login & Registration OTP Verification`,
    contentHtml,
    eventType: "AUTH_OTP",
    metadata: { otp, to },
  });
}

/**
 * Get dispatch history for user
 */
function getEmailDispatches(userEmail, limit = 20) {
  let list = dispatchHistory;
  if (userEmail) {
    list = list.filter((e) => e.to.toLowerCase() === userEmail.toLowerCase());
  }
  return list.slice(0, limit);
}

module.exports = {
  sendRealtimeNotificationEmail,
  sendOtpEmail,
  notifyBuddyMessage,
  notifyBuddyProgress,
  notifyMilestoneUnlocked,
  notifyNewFollower,
  getEmailDispatches,
};
