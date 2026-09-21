import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import nodemailer, { type Transporter } from 'nodemailer';
import { MailerService } from './mailer.service.js';
import { NotificationLog } from '../notifications/entities/notification-log.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([NotificationLog])],
    providers: [
        {
            provide: 'MAIL_TRANSPORTER',
            useFactory: async (): Promise<Transporter> => {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD,
                    },
                });

                await transporter.verify();
                return transporter;
            },
        },
        MailerService,
    ],
    exports: [MailerService]
})
export class MailerModule {}
