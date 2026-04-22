import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class WhatsAppSenderService {
  private readonly logger = new Logger(WhatsAppSenderService.name);
  private readonly client: AxiosInstance;
  private readonly phoneNumberId: string;

  constructor(private config: ConfigService) {
    const apiVersion = config.get('META_API_VERSION') || 'v19.0';
    this.phoneNumberId = config.get('WHATSAPP_PHONE_NUMBER_ID') || '';

    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      headers: {
        Authorization: `Bearer ${config.get('WHATSAPP_API_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async sendText(to: string, text: string): Promise<string> {
    // Sanitizar el número: eliminar cualquier cosa que no sea un dígito (como el '+')
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
}