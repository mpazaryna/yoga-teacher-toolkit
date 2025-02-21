import { type GeneratorConfig, type GeneratorContext, type GenerationResult } from './types.ts';
import { loadTemplate, applyContext } from './template.ts';
import { withRetry } from './utils.ts';

/**
 * Creates a template generator for LLM content generation
 */
export function createGenerator(config: GeneratorConfig) {
  let template: string | null = null;
  let context: GeneratorContext | null = null;

  const generator = {
    async loadTemplate(templatePath: string) {
      console.log("Loading template from:", templatePath);
      template = await loadTemplate(templatePath);
      console.log("Template loaded, returning generator");
      return generator;
    },

    withContext(ctx: GeneratorContext) {
      console.log("Setting context:", ctx);
      context = ctx;
      console.log("Context set, returning generator");
      return generator;
    },

    async generate(): Promise<GenerationResult> {
      console.log("Starting generation");
      if (!template) throw new Error('Template not loaded');
      if (!context) throw new Error('Context not provided');

      const prompt = applyContext(template, context);
      
      const content = await withRetry(
        async () => {
          const messages = [{
            role: "user",
            content: prompt
          }];
          
          const response = await config.llm.complete(messages);
          if (!response?.message?.content) {
            throw new Error("No content received from LLM");
          }
          return response.message.content;
        },
        config.retryOptions
      );

      return {
        content: config.transforms?.reduce(
          (acc, transform) => transform(acc), 
          content
        ) ?? content,
        metadata: {
          generatedAt: new Date(),
        }
      };
    }
  };

  return generator;
} 