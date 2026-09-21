import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import type { Transporter } from 'nodemailer';
import { User } from '../users/entities/user.entity.js';
import {
    NotificationLog,
    NotificationStatus,
    NotificationType,
} from '../notifications/entities/notification-log.entity.js';

const welcomeTemplate = readFile(
    new URL('./templates/welcome.hbs', import.meta.url),
    'utf8',
).then((template) => Handlebars.compile(template, { strict: true }));

const requestSubmittedTemplate = readFile(
    new URL('./templates/request-submitted.hbs', import.meta.url),
    'utf8',
).then((template) => Handlebars.compile(template, { strict: true }));

interface RequestSubmittedLine {
    itemName: string;
    quantity: number;
}

@Injectable()
export class MailerService {
    constructor(
        @Inject('MAIL_TRANSPORTER')
        private readonly mailerService: Transporter,
        @InjectRepository(NotificationLog)
        private readonly notificationLogRepository: Repository<NotificationLog>,
    ) {}

    async sendWelcomeEmail(user: User) {
        const renderWelcomeTemplate = await welcomeTemplate;

        await this.mailerService.sendMail({
            from: process.env.SMTP_DEFAULT_FROM,
            to: user.email,
            subject: 'Welcome to CoDev OSRS!',
            html: renderWelcomeTemplate({
                name: user.firstName,
                role: user.role,
                portalUrl: process.env.PORTAL_URL,
            }),
        });
    }

    /**
     * Sends the "Request Submitted" email (process-flow.md §1) to the
     * requestor, and persists the outcome — a notification is logged
     * whether the send succeeds or fails (FR-014/FR-015), so a delivery
     * failure never silently loses the audit trail.
     */
    async sendRequestSubmittedEmail(
        requestId: number,
        requestorName: string,
        recipient: string,
        items: RequestSubmittedLine[],
    ): Promise<void> {
        const renderTemplate = await requestSubmittedTemplate;
        const subject = 'Office Supplies Request Submitted';
        const html = renderTemplate({ name: requestorName, requestId, items });

        const log = this.notificationLogRepository.create({
            requestId,
            type: NotificationType.SUBMITTED,
            recipients: [recipient],
            subject,
            body: html,
            status: NotificationStatus.LOGGED,
            error: null,
        });

        try {
            await this.mailerService.sendMail({
                from: process.env.SMTP_DEFAULT_FROM,
                to: recipient,
                subject,
                html,
            });
            log.status = NotificationStatus.SENT;
        } catch (error) {
            log.status = NotificationStatus.FAILED;
            log.error = error instanceof Error ? error.message : String(error);
        }

        await this.notificationLogRepository.save(log);
    }
}
