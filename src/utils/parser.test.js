import { describe, expect, it } from 'vitest';
import { getSentenceForToken, parseText } from './parser.js';

describe('parser', () => {
  it('keeps contractions, numbers and trailing punctuation inside clickable tokens', () => {
    const tokens = parseText("I'm 42, and she's well.");
    const words = tokens.filter(token => token.type === 'word');

    expect(words.map(token => token.raw)).toEqual(["I'm", '42,', 'and', "she's", 'well.']);
    expect(words.map(token => token.clean)).toEqual(["i'm", '42', 'and', "she's", 'well']);
  });

  it('extracts the sentence around the selected token', () => {
    const tokens = parseText('First sentence here. Second one now!');
    const secondSentenceIndex = tokens.findIndex(token => token.raw.toLowerCase() === 'second');

    expect(getSentenceForToken(tokens, secondSentenceIndex)).toBe(' Second one now!');
  });
});
