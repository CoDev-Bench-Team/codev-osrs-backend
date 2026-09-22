import { Inject, Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import type { Transporter } from 'nodemailer';
import { User } from '../users/entities/user.entity.js';

const welcomeTemplate = readFile(
    new URL('./templates/welcome.hbs', import.meta.url),
    'utf8',
).then((template) => Handlebars.compile(template, { strict: true }));

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
}
