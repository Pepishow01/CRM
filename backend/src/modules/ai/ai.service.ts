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

      // Filter messages (exclude private notes and empty)
      const filtered = rawMessages.filter(m => !m.isPrivate && m.content?.trim());
      if (filtered.length === 0) return null;

      // Last message must be from the client
      const lastMsg = filtered[filtered.length - 1];
      if (lastMsg.direction !== 'inbound') return null;

      // Build labeled transcript of everything EXCEPT the last client message
      const history = filtered.slice(0, -1);
      const transcript = history.length > 0
        ? history.map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Manu'}: ${m.content}`).join('\n')
        : '(inicio de la conversación)';

      // History + continuation rules go FIRST so they dominate over any "SIEMPRE" rules in the base prompt
      const systemPrompt = `Sos un agente de ventas que está teniendo una conversación por WhatsApp. Antes de responder, leé el historial completo y continuá desde donde quedó — exactamente como lo haría una persona real que retoma el chat.

=== HISTORIAL DE LA CONVERSACIÓN ===
${transcript}
=== FIN DEL HISTORIAL ===

REGLAS DE CONTINUACIÓN (son las que mandan, siempre):
1. Si en el historial ya saludaste al cliente → NO repetís el saludo.
2. Si ya preguntaste el nombre y el cliente lo respondió → usás ese nombre, NO preguntás de nuevo.
3. Si el cliente te acaba de dar su nombre → respondés con "Buenísimo [nombre]!" o similar y avanzás al siguiente paso.
4. Si ya pediste un dato y el cliente lo dio → no lo pedís de nuevo, avanzás.
5. Respondés ÚNICAMENTE al último mensaje del cliente. No al historial anterior.
6. Podés responder cualquier pregunta con tu conocimiento (destinos, clima, excursiones, sargazo, gastronomía, cultura, etc.).
7. FORMATO: Si enviás varios mensajes por separado, usás "---" como separador. Sin "Mensaje 1:". Solo el texto.
8. EMOJIS: Variados y con moderación. Nunca el mismo dos veces seguidas.

A continuación tenés el perfil de personalidad y el flujo de trabajo que debés seguir para esta agencia:

${basePrompt}`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: lastMsg.content }],
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