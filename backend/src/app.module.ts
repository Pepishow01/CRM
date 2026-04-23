import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ChatsModule } from './modules/chats/chats.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AiModule } from './modules/ai/ai.module';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';
import { LabelsModule } from './modules/labels/labels.module';
import { CannedResponsesModule } from './modules/canned-responses/canned-responses.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EmailModule } from './modules/email/email.module';
import { WidgetModule } from './modules/widget/widget.module';
import { CustomAttributesModule } from './modules/custom-attributes/custom-attributes.module';
import { SearchModule } from './modules/search/search.module';
import { MacrosModule } from './modules/macros/macros.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('database.url'),
        entities: [__dirname + '/modules/**/entities/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
      }),
    }),
    AuthModule,
    UsersModule,
    ContactsModule,
    ChatsModule,
    MessagesModule,
    WebhooksModule,
    AiModule,
    HealthModule,
    SettingsModule,
    LabelsModule,
    CannedResponsesModule,
    TeamsModule,
    ReportsModule,
    EmailModule,
    WidgetModule,
    CustomAttributesModule,
    SearchModule,
    MacrosModule,
  ],
})
export class AppModule {}