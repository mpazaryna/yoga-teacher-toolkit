export interface ContentHandler {
  validateContext(context: GenerationContext): void;
  formatOutput(content: string, context: GenerationContext): string;
}

export interface GenerationContext {
  type: ContentType;
  name: string;
  style?: string;
}

export type ContentType = 'yoga' | 'dharma';

export interface YogaContext extends GenerationContext {
  type: 'yoga';
  level: string;
  duration: string;
  focus: string;
  props?: string[];
  contraindications?: string[];
  concept: string;
}

export interface DharmaTalkContext extends GenerationContext {
  type: 'dharma';
  focus: string;
  duration?: string;
  targetAudience?: string;
  concept: string;
} 