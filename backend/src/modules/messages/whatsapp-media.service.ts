import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data');

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

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
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async saveLocally(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<string> {
    const ext = path.extname(file.originalname) || '';
    const uuid = crypto.randomUUID();
    const filename = `${uuid}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    await fs.promises.writeFile(filepath, file.buffer);
    return `local_${uuid}${ext}`;
  }

  async getLocalFile(mediaId: string): Promise<{ buffer: Buffer; contentType: string; filename: string } | null> {
    if (!mediaId.startsWith('local_')) return null;
    const filename = mediaId.slice(6);
    const filepath = path.join(UPLOADS_DIR, filename);
    try {
      const buffer = await fs.promises.readFile(filepath);
      const ext = path.extname(filename).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
      };
      const contentType = mimeMap[ext] || 'application/octet-stream';
      return { buffer, contentType, filename };
    } catch {
      return null;
    }
  }

  async uploadToMeta(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<string> {
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

  async uploadMedia(file: any): Promise<string> {
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
