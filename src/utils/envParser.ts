// .env file parser and import utilities

export interface EnvKeyEntry {
  key: string;
  value: string;
  lineNumber: number;
  comment?: string;
}

export interface ParsedEnvFile {
  entries: EnvKeyEntry[];
  errors: Array<{ line: number; message: string }>;
}

/**
 * Parse .env file content and extract API keys
 */
export function parseEnvFile(content: string): ParsedEnvFile {
  const lines = content.split('\n');
  const entries: EnvKeyEntry[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  let currentComment: string | undefined;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      currentComment = undefined;
      return;
    }

    // Handle comments
    if (trimmed.startsWith('#')) {
      currentComment = trimmed.substring(1).trim();
      return;
    }

    // Parse key=value pairs
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      // Not a valid env variable format
      currentComment = undefined;
      return;
    }

    const [, key, rawValue] = match;

    // Remove quotes if present
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Skip empty values
    if (!value) {
      errors.push({ line: lineNumber, message: `Empty value for ${key}` });
      currentComment = undefined;
      return;
    }

    entries.push({
      key,
      value,
      lineNumber,
      comment: currentComment,
    });

    currentComment = undefined;
  });

  return { entries, errors };
}

/**
 * Detect service type from environment variable name
 */
export function detectServiceFromKey(key: string): string | null {
  const keyUpper = key.toUpperCase();

  if (keyUpper.includes('OPENAI')) return 'OpenAI';
  if (keyUpper.includes('ANTHROPIC') || keyUpper.includes('CLAUDE')) return 'Anthropic';
  if (keyUpper.includes('AZURE')) return 'Azure';
  if (keyUpper.includes('GOOGLE') || keyUpper.includes('GEMINI')) return 'Google';
  if (keyUpper.includes('COHERE')) return 'Cohere';
  if (keyUpper.includes('HUGGING') || keyUpper.includes('HF_')) return 'Hugging Face';

  return null;
}

/**
 * Detect service type from API key format
 */
export function detectServiceFromValue(value: string): string | null {
  // OpenAI: sk-...
  if (value.startsWith('sk-') && !value.startsWith('sk-ant-')) {
    return 'OpenAI';
  }

  // Anthropic: sk-ant-...
  if (value.startsWith('sk-ant-')) {
    return 'Anthropic';
  }

  // Azure: typically 32 hex characters
  if (/^[a-f0-9]{32}$/i.test(value)) {
    return 'Azure';
  }

  // Google: AIza...
  if (value.startsWith('AIza')) {
    return 'Google';
  }

  return null;
}

/**
 * Generate a friendly name from environment variable key
 */
export function generateNameFromKey(key: string): string {
  // Remove common prefixes
  let name = key
    .replace(/^(API_KEY|APIKEY|KEY)_?/i, '')
    .replace(/_?(API_KEY|APIKEY|KEY)$/i, '');

  // Convert SCREAMING_SNAKE_CASE to Title Case
  name = name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return name || 'Imported Key';
}

/**
 * Validate if a string looks like an API key
 */
export function looksLikeApiKey(value: string): boolean {
  // Too short
  if (value.length < 20) return false;

  // Too long (probably not an API key)
  if (value.length > 200) return false;

  // Contains spaces (unlikely for API keys)
  if (value.includes(' ')) return false;

  // Common API key patterns
  const patterns = [
    /^sk-[a-zA-Z0-9-_]+$/, // OpenAI/Anthropic style
    /^[a-f0-9]{32,}$/i, // Hex keys
    /^AIza[a-zA-Z0-9_-]+$/, // Google
    /^[a-zA-Z0-9_-]{32,}$/, // Generic base64-ish
  ];

  return patterns.some(pattern => pattern.test(value));
}

/**
 * Filter env entries to only include likely API keys
 */
export function filterApiKeys(entries: EnvKeyEntry[]): EnvKeyEntry[] {
  return entries.filter(entry => {
    // Check if key name suggests it's an API key
    const keyUpper = entry.key.toUpperCase();
    const hasKeyInName = keyUpper.includes('KEY') ||
                         keyUpper.includes('TOKEN') ||
                         keyUpper.includes('SECRET');

    // Check if value looks like an API key
    const valueIsKey = looksLikeApiKey(entry.value);

    return hasKeyInName && valueIsKey;
  });
}
