import { ContentHandler, DharmaTalkContext, GenerationContext } from './ContentHandler.ts';
import { generateShortId } from '../utils/idGenerator.ts';

export class DharmaContentHandler implements ContentHandler {
  validateContext(context: GenerationContext): void {
    if (context.type !== 'dharma') throw new Error('Invalid context type');
    const dharma = context as DharmaTalkContext;
    if (!dharma.concept) throw new Error('Concept is required for dharma talks');
    if (!dharma.focus) throw new Error('Focus is required for dharma talks');
  }

  formatOutput(content: string, context: GenerationContext): string {
    const dharma = context as DharmaTalkContext;
    return [
      "---",
      `id: ${generateShortId()}`,
      `date: ${new Date().toISOString()}`,
      `type: dharma`,
      `name: ${dharma.name}`,
      `focus: ${dharma.focus}`,
      dharma.style ? `style: ${dharma.style}` : null,
      dharma.duration ? `duration: ${dharma.duration}` : null,
      dharma.targetAudience ? `targetAudience: ${dharma.targetAudience}` : null,
      "status: draft",
      "---",
      "",
      `# ${dharma.name} - Dharma Talk`,
      `Focus: ${dharma.focus}`,
      `Concept: ${dharma.concept}`,
      '',
      content
    ].filter(Boolean).join('\n');
  }
} 