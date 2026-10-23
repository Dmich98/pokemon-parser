import { describe, expect, it } from 'bun:test';

import { WikiArticleParser } from '../../src/parsers/WikiArticleParser';

describe('WikiArticleParser', () => {
  it('extracts and normalizes the title and canonical URL', () => {
    const parser = new WikiArticleParser(`
      <link rel="canonical" href="https://en.wikipedia.org/wiki/TypeScript">
      <h1 id="firstHeading">  <span>TypeScript</span>  </h1>
    `);

    expect(parser.parse().getData()).toEqual({
      name: 'TypeScript',
      url: 'https://en.wikipedia.org/wiki/TypeScript',
    });
  });

  it('returns the first wiki link in document order, including nested elements', () => {
    const parser = new WikiArticleParser(`
      <section data-mw-section-id="0">
        <p>
          <a href="/wiki/External">Not a wiki link</a>
          <a rel="mw:WikiLink">No href</a>
          <b><span><a rel="other mw:WikiLink" href="./First">First</a></span></b>
          <a rel="mw:WikiLink" href="./Second">Second</a>
        </p>
      </section>
    `);

    expect(parser.firstLinkOnPage).toBe('./First');
  });

  it('considers paragraphs in all article sections in document order', () => {
    const parser = new WikiArticleParser(`
      <p><a rel="mw:WikiLink" href="./Outside">Outside</a></p>
      <section data-mw-section-id="1">
        <div><a rel="mw:WikiLink" href="./Navigation">Outside paragraph</a></div>
        <p><a rel="mw:WikiLink" href="./Later">Later section</a></p>
      </section>
      <section data-mw-section-id="0">
        <div><a rel="mw:WikiLink" href="./Navigation">Outside paragraph</a></div>
        <p><a rel="mw:WikiLink" href="./First">First</a></p>
      </section>
    `);

    expect(parser.firstLinkOnPage).toBe('./Later');
  });

  it('continues into a later section when the introduction only has excluded links', () => {
    const parser = new WikiArticleParser(`
      <section data-mw-section-id="0">
        <p><span class="IPA"><a rel="mw:WikiLink" href="./Excluded">Excluded</a></span></p>
      </section>
      <section data-mw-section-id="1">
        <p><a rel="mw:WikiLink" href="./First">First</a></p>
      </section>
    `);

    expect(parser.firstLinkOnPage).toBe('./First');
  });

  it('ignores links outside paragraphs and sections without a section identifier', () => {
    const parser = new WikiArticleParser(`
      <p><a rel="mw:WikiLink" href="./Outside">Outside</a></p>
      <section><p><a rel="mw:WikiLink" href="./Unmarked">Unmarked</a></p></section>
      <section data-mw-section-id="0">
        <div><a rel="mw:WikiLink" href="./Navigation">Navigation</a></div>
      </section>
    `);

    expect(parser.firstLinkOnPage).toBeUndefined();
  });

  describe.each([
    ['template', 'typeof="other mw:Transclusion"'],
    ['reference extension', 'typeof="other mw:Extension/ref"'],
    ['reference', 'class="other reference"'],
    ['modern reference', 'class="other mw-ref"'],
    ['transcription', 'class="other IPA"'],
  ])('excludes %s links', (_name, attribute) => {
    it('checks the link itself', () => {
      const parser = new WikiArticleParser(`
        <section data-mw-section-id="0">
          <p>
            <a ${attribute} rel="mw:WikiLink" href="./Excluded">Excluded</a>
            <a rel="mw:WikiLink" href="./First">First</a>
          </p>
        </section>
      `);

      expect(parser.firstLinkOnPage).toBe('./First');
    });

    it('checks ancestors beyond the immediate parent', () => {
      const parser = new WikiArticleParser(`
        <section data-mw-section-id="0">
          <p>
            <span ${attribute}>
              <b><a rel="mw:WikiLink" href="./Excluded">Excluded</a></b>
            </span>
            <a rel="mw:WikiLink" href="./First">First</a>
          </p>
        </section>
      `);

      expect(parser.firstLinkOnPage).toBe('./First');
    });
  });

  it.each([
    '',
    '<section data-mw-section-id="0"><p>No links</p></section>',
    `<section data-mw-section-id="0">
      <p><span class="IPA"><a rel="mw:WikiLink" href="./Excluded">Excluded</a></span></p>
    </section>`,
  ])('returns undefined when no suitable link exists (case %#)', (html) => {
    expect(new WikiArticleParser(html).firstLinkOnPage).toBeUndefined();
  });
});
