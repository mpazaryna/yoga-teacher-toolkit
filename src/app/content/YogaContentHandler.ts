import { ContentHandler, YogaContext, GenerationContext } from './ContentHandler.ts';
import { generateShortId } from '../utils/idGenerator.ts';

export class YogaContentHandler implements ContentHandler {
  validateContext(context: GenerationContext): void {
    if (context.type !== 'yoga') throw new Error('Invalid context type');
    const yoga = context as YogaContext;
    if (!yoga.level) throw new Error('Level is required for yoga sequences');
    if (!yoga.duration) throw new Error('Duration is required for yoga sequences');
    if (!yoga.focus) throw new Error('Focus is required for yoga sequences');
  }

  formatOutput(content: string, context: GenerationContext): string {
    const yoga = context as YogaContext;
    return [
      "---",
      `id: ${generateShortId()}`,
      `date: ${new Date().toISOString()}`,
      `type: yoga`,
      `name: ${yoga.name}`,
      `level: ${yoga.level}`,
      `duration: ${yoga.duration}`,
      `focus: ${yoga.focus}`,
      yoga.style ? `style: ${yoga.style}` : null,
      yoga.props ? `props: ${JSON.stringify(yoga.props)}` : null,
      yoga.contraindications ? `contraindications: ${JSON.stringify(yoga.contraindications)}` : null,
      "status: draft",
      "---",
      "",
      `# ${yoga.name} - ${yoga.level} Level Yoga Sequence`,
      `Duration: ${yoga.duration}`,
      `Focus: ${yoga.focus}`,
      yoga.props ? `Props: ${yoga.props.join(', ')}` : '',
      '',
      content
    ].filter(Boolean).join('\n');
  }
} 