const string = (value?: string): string => value?.trim() ?? '';

const number = (value?: string): number | null => {
  const normalized = string(value);

  if (!normalized) return null;

  const result = Number(normalized);

  if (!Number.isFinite(result)) {
    throw new Error(`Invalid number: ${value}`);
  }

  return result;
};

export const normalize = { string, number };
