const string = (value?: string): string => value?.trim() ?? '';

const number = (value?: string): number => {
  const normalized = string(value);

  if (!normalized) return 0;

  const result = Number(normalized);

  if (!Number.isFinite(result)) {
    throw new Error(`Invalid number: ${value}`);
  }

  return result;
};

export const normalize = { string, number };
