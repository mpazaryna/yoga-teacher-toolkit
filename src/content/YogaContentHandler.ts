import { ContentHandler, YogaContext, GenerationContext } from './ContentHandler.ts';
import { generateShortId } from '../utils/idGenerator.ts';

export class YogaContentHandler implements ContentHandler {
  validateContext(context: GenerationContext): void {
    const yoga = context as YogaContext;
    if (!yoga.duration || !yoga.level || !yoga.focus || !yoga.concept) {
      throw new Error('Missing required fields in yoga context');
    }
  }

  formatOutput(content: string, context: GenerationContext): string {
    const yoga = context as YogaContext;
    
    const metadata = [
      `name: ${yoga.name}`,
      `type: ${yoga.type}`,
      `duration: ${yoga.duration}`,
      `level: ${yoga.level}`,
      `style: ${yoga.style}`,
      `focus: ${yoga.focus}`,
      `concept: ${yoga.concept}`,
      `props: ${JSON.stringify(yoga.props)}`,
      yoga.asanas ? `asanas: ${JSON.stringify(yoga.asanas)}` : null,
      `transitions: ${JSON.stringify(yoga.transitions)}`,
      `breathwork: ${JSON.stringify(yoga.breathwork)}`,
      `peak: ${JSON.stringify(yoga.peak)}`,
      `modifications: ${JSON.stringify(yoga.modifications)}`
    ].filter(Boolean).join('\n');

    return `---\n${metadata}\n---\n\n${content}`;
  }
} 