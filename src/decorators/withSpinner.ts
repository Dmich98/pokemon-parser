import { spinner } from '@clack/prompts';

export function withSpinner<This, Args extends unknown[], Result>(
  method: (this: This, ...args: Args) => Promise<Result>,
) {
  return async function (this: This, ...args: Args): Promise<Result> {
    const progress = spinner({ withGuide: false });
    const url = typeof args[0] === 'string' ? args[0] : 'page';
    progress.start(`Fetching ${url}`);

    try {
      const result = await method.apply(this, args);
      progress.clear();
      return result;
    } catch (error) {
      progress.error('Request failed');
      throw error;
    }
  };
}
