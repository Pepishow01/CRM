import { Controller, Get, Param, Res, UseGuards, NotFoundException } from '@nestjs/common';
import * as express from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WhatsAppMediaService } from './whatsapp-media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: WhatsAppMediaService) {}

  @Get(':mediaId')
  @UseGuards(JwtAuthGuard)
  async getMedia(@Param('mediaId') mediaId: string, @Res() res: express.Response) {
    // 1. Obtener la URL real de Meta
    const url = await this.mediaService.getMediaUrl(mediaId);
    if (!url) {
      throw new NotFoundException('No se pudo encontrar la URL del archivo en Meta');
    }

    // 2. Descargar el archivo y pasarlo al navegador (Proxy)
    const { buffer, contentType } = await this.mediaService.getMediaBuffer(url);
    
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache por un año
    res.send(buffer);
  }
}
