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

const requestNeedsApprovalTemplate = readFile(
    new URL('./templates/request-needs-approval.hbs', import.meta.url),
    'utf8',
).then((template) => Handlebars.compile(template, { strict: true }));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats as "Sep 16, 2026, 9:42AM", matching the design. */
const formatSubmittedAt = (date: Date): string => {
    const hours24 = date.getHours();
    const hours = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const meridiem = hours24 < 12 ? 'AM' : 'PM';

    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${hours}:${minutes}${meridiem}`;
};

export interface RequestEmailLine {
    itemName: string;
    quantity: number;
}

/** Everything both new-request emails need about the request. */
export interface NewRequestEmailContext {
    requestId: number;
    displayId: string;
    submittedAt: Date;
    purpose: string | null;
    items: RequestEmailLine[];
    requesterFirstName: string;
    requesterFullName: string;
    requesterOffice: string;
    requesterEmail: string;
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

    /** Sends the "Your request is in" email to the employee who submitted it. */
    async sendRequestSubmittedEmail(
        context: NewRequestEmailContext,
    ): Promise<void> {
        const renderTemplate = await requestSubmittedTemplate;

        await this.send({
            to: context.requesterEmail,
            subject: `Your request ${context.displayId} has been submitted`,
            html: renderTemplate({
                displayId: context.displayId,
                firstName: context.requesterFirstName,
                submittedAt: formatSubmittedAt(context.submittedAt),
                items: context.items,
                purpose: context.purpose,
                viewUrl: `${process.env.PORTAL_URL}/requests/${context.requestId}`,
                year: context.submittedAt.getFullYear(),
            }),
        });
    }

    /**
     * Sends the "A new request needs your approval" email to every admin.
     * Sent as a single message with the admins on BCC, so recipients don't
     * see each other's addresses.
     */
    async sendRequestNeedsApprovalEmail(
        context: NewRequestEmailContext,
        adminEmails: string[],
    ): Promise<void> {
        if (!adminEmails.length) {
            return;
        }

        const renderTemplate = await requestNeedsApprovalTemplate;

        await this.send({
            bcc: adminEmails,
            subject: `${context.displayId} needs your approval`,
            html: renderTemplate({
                displayId: context.displayId,
                requesterName: context.requesterFullName,
                requesterOffice: context.requesterOffice,
                itemCount: context.items.length,
                singleItem: context.items.length === 1,
                submittedAt: formatSubmittedAt(context.submittedAt),
                items: context.items,
                purpose: context.purpose,
                reviewUrl: `${process.env.PORTAL_URL}/requests/${context.requestId}`,
                year: context.submittedAt.getFullYear(),
            }),
        });
    }

    /**
     * Best-effort delivery: a failure is swallowed rather than thrown, so it
     * never rolls back an already-valid submit. Failures aren't persisted for
     * MVP (see PR #79 review) — an outbox-based retry is planned later.
     */
    private async send(options: {
        to?: string;
        bcc?: string[];
        subject: string;
        html: string;
    }): Promise<void> {
        try {
            await this.mailerService.sendMail({
                from: process.env.SMTP_DEFAULT_FROM,
                ...options,
            });
        } catch {
            // Intentionally ignored — see above.
        }
    }
}
