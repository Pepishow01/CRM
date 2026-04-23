import {
  Controller, Get, Post, Param, Res, UseGuards,
  NotFoundException, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as express from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WhatsAppMediaService } from './whatsapp-media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: WhatsAppMediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: any) {
    if (!file) throw new Error('No se recibió ningún archivo');
    const mediaId = await this.mediaService.saveLocally(file);
    return { mediaId, originalName: file.originalname, mimetype: file.mimetype };
  }

  @Get(':mediaId')
  @UseGuards(JwtAuthGuard)
  async getMedia(@Param('mediaId') mediaId: string, @Res() res: express.Response) {
    const localFile = await this.mediaService.getLocalFile(mediaId);
    if (localFile) {
      res.set('Content-Type', localFile.contentType);
      res.set('Cache-Control', 'public, max-age=31536000');
      return res.send(localFile.buffer);
    }

    const url = await this.mediaService.getMediaUrl(mediaId);
    if (!url) throw new NotFoundException('No se pudo encontrar la URL del archivo en Meta');

    const { buffer, contentType } = await this.mediaService.getMediaBuffer(url);
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);
  }
}
