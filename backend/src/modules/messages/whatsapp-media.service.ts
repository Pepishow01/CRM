import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data');

@Injectable()
export class WhatsAppMediaService {
  private readonly logger = new Logger(WhatsAppMediaService.name);
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    const apiVersion = this.config.get('META_API_VERSION') || 'v19.0';
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      headers: {
        Authorization: `Bearer ${this.config.get('WHATSAPP_API_TOKEN')}`,
      },
    });
  }

  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      this.logger.log(`Obteniendo URL para mediaId: ${mediaId}`);
      const response = await this.client.get(`/${mediaId}`);
      return response.data.url;
    } catch (error) {
      this.logger.error(`Error obteniendo URL de media de Meta: ${error.message}`);
      return null;
    }
  }

  async getMediaBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${this.config.get('WHATSAPP_API_TOKEN')}`,
        },
      });
      return {
        buffer: Buffer.from(response.data),
        contentType: String(response.headers['content-type'] || 'application/octet-stream'),
      };
    } catch (error) {
      this.logger.error(`Error descargando media de Meta: ${error.message}`);
      throw error;
    }
  }

  async uploadMedia(file: Express.Multer.File): Promise<string> {
    try {
      const phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID');
      const form = new FormData();
      form.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      form.append('messaging_product', 'whatsapp');

      const response = await this.client.post(`/${phoneNumberId}/media`, form, {
        headers: form.getHeaders(),
      });
      return response.data.id;
    } catch (error) {
      this.logger.error(`Error subiendo media a Meta: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
      throw error;
    }
  }
}
