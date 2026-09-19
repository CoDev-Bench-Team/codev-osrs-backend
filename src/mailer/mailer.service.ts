import { Injectable } from "@nestjs/common";
import { MailerService as NestMailerService } from "@nestjs-modules/mailer";
import { User } from "../users/entities/user.entity.js";

@Injectable()
export class MailerService {
    constructor(private readonly mailerService: NestMailerService) {}

    async sendWelcomeEmail(user: User) {
        await this.mailerService.sendMail({
            from: process.env.SMTP_DEFAULT_FROM,
            to: user.email,
            subject: 'Welcome to CoDev OSRS!',
            template: 'welcome',
            context: {
                name: user.firstName,
                role: user.role,
                portalUrl: process.env.PORTAL_URL
            },
        });
    }
}
