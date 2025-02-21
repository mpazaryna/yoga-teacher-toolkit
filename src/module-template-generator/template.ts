/**
 * Template loading and context injection
 */
export const loadTemplate = async (templatePath: string): Promise<string> => {
  try {
    return await Deno.readTextFile(templatePath);
  } catch (error) {
    throw new Error(`Failed to load template: ${error.message}`);
  }
};

export const applyContext = (template: string, context: Record<string, unknown>): string => {
  return Object.entries(context).reduce(
    (result, [key, value]) => {
      const placeholder = new RegExp(`{${key}}`, 'gi');
      return result.replace(
        placeholder,
        Array.isArray(value) ? value.join(', ') : String(value ?? '')
      );
    },
    template
  );
}; 