import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MailerService } from './mailer.service.js';

const templatesDirectory = dirname(fileURLToPath(import.meta.url)) + '/templates';

@Module({
    imports: [
        NestMailerModule.forRoot({
            transport: {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT ?? '587', 10),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                }
            },
            verifyTransporters: true,
            defaults: {
                from: process.env.SMTP_DEFAULT_FROM
            },
            template: {
                dir: templatesDirectory,
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true
                }
            }
        })
    ],
    providers: [MailerService],
    exports: [MailerService]
})
export class MailerModule {}
