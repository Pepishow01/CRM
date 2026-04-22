import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class WhatsAppSenderService {
  private readonly logger = new Logger(WhatsAppSenderService.name);
  private readonly client: AxiosInstance;
  private readonly phoneNumberId: string;

  constructor(private config: ConfigService) {
    const apiVersion = config.get('WHATSAPP_API_VERSION') || 'v20.0';
    this.phoneNumberId = (config.get('WHATSAPP_PHONE_NUMBER_ID') || '').trim();
    const token = (config.get('WHATSAPP_API_TOKEN') || '').trim();

    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async sendText(to: string, text: string): Promise<string> {
    const cleanTo = to.replace(/\D/g, '');
    this.logger.log(`Enviando mensaje a: ${cleanTo} (original: ${to})`);

    try {
      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        },
      );

      const messageId = response.data.messages?.[0]?.id;
      this.logger.log(`Mensaje enviado a ${to} — ID: ${messageId}`);
      return messageId;

    } catch (error) {
      const metaError = error?.response?.data?.error;
      if (metaError) {
        this.logger.error(
          `Error Meta API → código: ${metaError.code}, mensaje: ${metaError.message}`,
        );
        if (metaError.code === 190) {
          throw new BadRequestException(
            'Token de WhatsApp inválido o expirado. Renovalo en Meta Developer Console.',
          );
        }
        if (metaError.code === 131030 || metaError.code === 131005) {
          throw new BadRequestException(
            `Acceso Denegado. Si es un número de prueba, agregalo como destinatario en Meta Developer Console (WhatsApp > API Setup). Si es un número real, verifica que el Token tenga permisos 'whatsapp_business_messaging'.`,
          );
        }
        if (metaError.code === 131047) {
          throw new BadRequestException(
            'El usuario no inició conversación en las últimas 24 horas.',
          );
        }
        throw new BadRequestException(
          `Error de WhatsApp (${metaError.code}): ${metaError.message}`,
        );
      }
      this.logger.error(`Error de red al contactar Meta API: ${error.message}`);
      throw new BadRequestException(
        'No se pudo conectar con WhatsApp. Verificá la configuración del servidor.',
      );
    }
  }

  async sendMediaById(to: string, mediaId: string, type: 'image' | 'audio' | 'document' | 'video'): Promise<string> {
    const cleanTo = to.replace(/\D/g, '');
    try {
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: type,
        [type]: { id: mediaId }
      });
      return response.data.messages?.[0]?.id;
    } catch (error) {
      this.logger.error(`Error enviando media por ID: ${error.message}`);
      throw new BadRequestException('Error al enviar archivo por WhatsApp');
    }
  }

  async getTemplates(): Promise<any[]> {
    const businessAccountId = this.config.get('WHATSAPP_BUSINESS_ACCOUNT_ID');
    if (!businessAccountId) {
      this.logger.warn('WHATSAPP_BUSINESS_ACCOUNT_ID no configurado en .env');
      return [];
    }
    try {
      const response = await this.client.get(`/${businessAccountId}/message_templates`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Error obteniendo plantillas: ${error.message}`);
      return [];
    }
  }

  async sendTemplate(to: string, templateName: string, languageCode: string): Promise<string> {
    const cleanTo = to.replace(/\D/g, '');
    try {
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode }
        }
      });
      return response.data.messages?.[0]?.id;
    } catch (error) {
      this.logger.error(`Error enviando plantilla: ${error.message}`);
      throw new BadRequestException('Error al enviar plantilla de WhatsApp');
    }
  }
}