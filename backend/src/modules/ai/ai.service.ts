import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { SettingsService } from '../settings/settings.service';
import {
  CLASSIFY_LEAD_PROMPT,
  SUGGEST_REPLIES_PROMPT,
  EXTRACT_TRAVEL_DATA_PROMPT,
  AUTO_REPLY_PROMPT,
} from './prompts/system.prompts';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic;
  private readonly model: string;
  readonly enabled: boolean;

  constructor(
    private config: ConfigService,
    private settingsService: SettingsService,
  ) {
    this.enabled = config.get('AI_ENABLED') === 'true';
    this.model = config.get('AI_MODEL') || 'claude-sonnet-4-5';

    this.client = new Anthropic({
      apiKey: config.get('ANTHROPIC_API_KEY') || '',
    });
  }

  async classifyLead(conversation: string): Promise<any> {
    if (!this.enabled) return null;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 500,
        system: CLASSIFY_LEAD_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analizá esta conversación y clasificá al lead:\n\n${conversation}`,
          },
        ],
      });

      return this.parseJson(response);
    } catch (err) {
      this.logger.error(`Error clasificando lead: ${err.message}`);
      return null;
    }
  }

  async suggestReplies(conversation: string, contactName?: string): Promise<any> {
    if (!this.enabled) return null;

    try {
      const customPrompt = await this.settingsService.get('AI_SUGGEST_REPLIES_PROMPT');
      const systemPrompt = customPrompt || SUGGEST_REPLIES_PROMPT;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `
Nombre del cliente: ${contactName ?? 'desconocido'}

Conversación:
${conversation}

Generá 3 sugerencias de respuesta para el último mensaje del cliente.
            `.trim(),
          },
        ],
      });

      return this.parseJson(response);
    } catch (err) {
      this.logger.error(`Error generando sugerencias: ${err.message}`);
      return null;
    }
  }

  async extractTravelData(conversation: string): Promise<any> {
    if (!this.enabled) return null;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 400,
        system: EXTRACT_TRAVEL_DATA_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Extraé los datos de viaje de esta conversación:\n\n${conversation}`,
          },
        ],
      });

      return this.parseJson(response);
    } catch (err) {
      this.logger.error(`Error extrayendo datos: ${err.message}`);
      return null;
    }
  }

  async generateAutoReply(
    rawMessages: Array<{ direction: string; content: string; isPrivate?: boolean }>,
    contactName?: string,
  ): Promise<string | null> {
    if (!this.enabled) return null;

    try {
      const customPrompt = await this.settingsService.get('AI_AUTO_REPLY_PROMPT');
      const basePrompt = customPrompt || AUTO_REPLY_PROMPT;
      // Tell Claude how to split multi-message replies
      const systemPrompt = `${basePrompt}\n\nSi necesitás enviar varios mensajes separados, separá cada uno con "---" en una línea sola. RESPONDE ÚNICAMENTE con el texto de los mensajes. Sin JSON ni explicaciones.`;

      // Build proper multi-turn Claude conversation (alternating user/assistant)
      const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      for (const msg of rawMessages) {
        if (msg.isPrivate || !msg.content?.trim()) continue;
        const role: 'user' | 'assistant' = msg.direction === 'inbound' ? 'user' : 'assistant';
        // Collapse consecutive same-role messages (Claude requires strict alternation)
        if (claudeMessages.length > 0 && claudeMessages[claudeMessages.length - 1].role === role) {
          claudeMessages[claudeMessages.length - 1].content += '\n' + msg.content;
        } else {
          claudeMessages.push({ role, content: msg.content });
        }
      }

      // Must end with a user message
      if (claudeMessages.length === 0 || claudeMessages[claudeMessages.length - 1].role !== 'user') {
        return null;
      }

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: claudeMessages,
      });

      return (response.content?.[0] as any)?.text ?? null;
    } catch (err) {
      this.logger.error(`Error generando respuesta automática: ${err.message}`);
      return null;
    }
  }

  async translateMessage(content: string, targetLang = 'es'): Promise<string | null> {
    if (!this.enabled) return null;
    try {
      const langNames: Record<string, string> = {
        es: 'Spanish', en: 'English', pt: 'Portuguese', fr: 'French', de: 'German', it: 'Italian',
      };
      const targetName = langNames[targetLang] ?? targetLang;
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 400,
        system: `You are a translator. Translate the user's message to ${targetName}. Reply with ONLY the translated text, no explanations.`,
        messages: [{ role: 'user', content }],
      });
      return (response.content?.[0] as any)?.text?.trim() ?? null;
    } catch (err) {
      this.logger.error(`Error traduciendo: ${err.message}`);
      return null;
    }
  }

  formatConversation(messages: Array<{ direction: string; content: string }>): string {
    return messages
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => `${m.direction === 'inbound' ? 'Cliente' : 'Tú (Asistente IA)'}: ${m.content}`)
      .join('\n');
  }

  private parseJson(response: any): any | null {
    try {
      const text = response.content?.[0]?.text ?? '';
      const clean = text.replace(/```json\n?|```\n?/g, '').trim();
      return JSON.parse(clean);
    } catch (e) {
      this.logger.warn(`No se pudo parsear respuesta JSON: ${e.message}`);
      return null;
    }
  }
}