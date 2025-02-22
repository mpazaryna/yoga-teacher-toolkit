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
  name: string;
  type: 'yoga';
  duration: string;
  level: string;
  style: string;
  focus: string;
  concept: string;
  props: string[];
  asanas?: string[];
  transitions: string[];
  breathwork: string[];
  peak: string[];
  modifications: string[];
}

export interface DharmaTalkContext extends GenerationContext {
  type: 'dharma';
  focus: string;
  duration?: string;
  targetAudience?: string;
  concept: string;
} 