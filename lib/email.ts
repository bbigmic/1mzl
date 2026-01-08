import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'

// SMTP Configuration
export function createTransporter() {
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  }

  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD in .env')
  }

  return nodemailer.createTransport(smtpConfig)
}

// Rate limiting: max emails per hour
const RATE_LIMIT = parseInt(process.env.EMAIL_RATE_LIMIT || '100')
const emailsSent: Map<string, number> = new Map()

export function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const hourAgo = now - 60 * 60 * 1000

  // Clean old entries
  for (const [key, timestamp] of emailsSent.entries()) {
    if (timestamp < hourAgo) {
      emailsSent.delete(key)
    }
  }

  // Count emails sent in last hour
  const count = Array.from(emailsSent.values()).filter(
    (ts) => ts > hourAgo
  ).length

  return count < RATE_LIMIT
}

export function recordEmailSent(userId: string) {
  emailsSent.set(`${userId}-${Date.now()}`, Date.now())
}

// Generate tracking pixel and click tracking
export function generateTrackingId(): string {
  return uuidv4()
}

export function injectTracking(html: string, trackingId: string, baseUrl: string): string {
  // Add tracking pixel
  const trackingPixel = `<img src="${baseUrl}/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;" />`
  
  // Add tracking to all links
  const linkRegex = /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi
  const trackedHtml = html.replace(linkRegex, (match, attrs, href) => {
    if (href.startsWith('http') && !href.includes(baseUrl)) {
      const trackedUrl = `${baseUrl}/api/email/track/click/${trackingId}?url=${encodeURIComponent(href)}`
      return `<a ${attrs.replace(href, trackedUrl)}>`
    }
    return match
  })

  return trackedHtml + trackingPixel
}

// Email template generator
export function generateEmailTemplate(
  subject: string,
  content: string,
  unsubscribeUrl: string,
  trackingId: string,
  baseUrl: string
): { html: string; text: string } {
  const htmlContent = injectTracking(content, trackingId, baseUrl)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <div style="color: #333333; line-height: 1.6;">
                ${htmlContent}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e5e5e5; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #666666; text-align: center;">
                Otrzymałeś ten email, ponieważ jesteś zapisany do naszej listy mailingowej.<br>
                <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Wypisz się z listy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // Plain text version
  const text = content
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim() + `\n\n---\nWypisz się: ${unsubscribeUrl}`

  return { html, text }
}

// Send email with error handling
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  from?: string
): Promise<void> {
  const transporter = createTransporter()
  const fromEmail = from || process.env.SMTP_FROM || process.env.SMTP_USER

  try {
    await transporter.sendMail({
      from: `ContentAI Pro <${fromEmail}>`,
      to,
      subject,
      html,
      text,
      headers: {
        'X-Mailer': 'ContentAI Pro',
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

// Validate email address
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Extract emails from text (for importing)
export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(emailRegex) || []
  return [...new Set(matches.map((email) => email.toLowerCase().trim()))]
}

