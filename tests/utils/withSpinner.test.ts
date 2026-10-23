import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import * as prompts from '@clack/prompts';
import { withSpinner } from '@decorators';

const createProgress = () => ({
  start: mock(),
  stop: mock(),
  message: mock(),
  cancel: mock(),
  error: mock(),
  clear: mock(),
  isCancelled: false,
});

describe('withSpinner decorator', () => {
  let progress: ReturnType<typeof createProgress>;
  let restoreSpinner: () => void;

  beforeEach(() => {
    progress = createProgress();
    const spy = spyOn(prompts, 'spinner').mockReturnValue(progress);
    restoreSpinner = () => spy.mockRestore();
  });

  afterEach(() => restoreSpinner());

  it('preserves this, arguments, and the returned value', async () => {
    class Operation {
      private readonly base = 10;

      @withSpinner
      async run(value: number): Promise<number> {
        return this.base + value;
      }
    }

    expect(await new Operation().run(5)).toBe(15);
    expect(progress.start).toHaveBeenCalledWith('Fetching page');
    expect(progress.clear).toHaveBeenCalledTimes(1);
    expect(progress.error).not.toHaveBeenCalled();
  });

  it('propagates the original rejection', async () => {
    const failure = new Error('Network unavailable');

    class Operation {
      @withSpinner
      async run(): Promise<never> {
        throw failure;
      }
    }

    await expect(new Operation().run()).rejects.toBe(failure);
    expect(progress.error).toHaveBeenCalledWith('Request failed');
    expect(progress.clear).not.toHaveBeenCalled();
  });

  it('keeps the spinner running until the operation finishes', async () => {
    const pending = Promise.withResolvers<string>();

    class Operation {
      @withSpinner
      async run(_url: string): Promise<string> {
        return pending.promise;
      }
    }

    const url = 'https://en.wikipedia.org/wiki/Science';
    const result = new Operation().run(url);

    expect(progress.start).toHaveBeenCalledWith(`Fetching ${url}`);
    expect(progress.clear).not.toHaveBeenCalled();

    pending.resolve('HTML');

    expect(await result).toBe('HTML');
    expect(progress.clear).toHaveBeenCalledTimes(1);
    expect(progress.error).not.toHaveBeenCalled();
  });

  it('also reports synchronous exceptions from the wrapped operation', async () => {
    const failure = new Error('Failed before creating a promise');
    const operation = withSpinner((): Promise<never> => {
      throw failure;
    });

    await expect(operation()).rejects.toBe(failure);
    expect(progress.error).toHaveBeenCalledTimes(1);
    expect(progress.clear).not.toHaveBeenCalled();
  });
});
