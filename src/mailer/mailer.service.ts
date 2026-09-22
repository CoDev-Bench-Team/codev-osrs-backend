import { Inject, Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import type { Transporter } from 'nodemailer';
import { User } from '../users/entities/user.entity.js';

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

    /** Sends the "Request Submitted" email (process-flow.md §1) to the
     * requestor. Best-effort: a delivery failure is swallowed rather than
     * thrown, so it never rolls back an already-valid submit. */
    async sendRequestSubmittedEmail(
        requestId: number,
        requestorName: string,
        recipient: string,
        items: RequestSubmittedLine[],
    ): Promise<void> {
        const renderTemplate = await requestSubmittedTemplate;

        try {
            await this.mailerService.sendMail({
                from: process.env.SMTP_DEFAULT_FROM,
                to: recipient,
                subject: 'Office Supplies Request Submitted',
                html: renderTemplate({ name: requestorName, requestId, items }),
            });
        } catch {
            // Delivery failure is not persisted for MVP (see PR #79 review) —
            // an outbox-based retry is planned as a later improvement.
        }
    }
}
