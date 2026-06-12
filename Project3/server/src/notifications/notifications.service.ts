import { Injectable } from '@nestjs/common';
import { appLogger } from '../common/app-logger';

@Injectable()
export class NotificationsService {
  private createTransport() {
    try {
      const nodemailer = require('nodemailer');
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
    } catch {
      return null;
    }
  }

  async sendEmail(to: string, subject: string, text: string) {
    const transport = this.createTransport();
    if (!transport || !process.env.SMTP_HOST) {
      appLogger.info('email_skipped', { to, subject, reason: 'smtp_not_configured' });
      return { delivered: false, skipped: true };
    }

    await transport.sendMail({
      from: process.env.MAIL_FROM ?? 'noreply@example.com',
      to,
      subject,
      text,
    });
    appLogger.info('email_sent', { to, subject });
    return { delivered: true, skipped: false };
  }

  async sendDiscord(webhookUrl: string, content: string) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }
    appLogger.info('discord_sent', { status: response.status });
    return { delivered: true };
  }
}

