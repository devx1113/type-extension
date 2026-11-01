const test = require('node:test');
const assert = require('node:assert');
const { HangulComposer, jamoForKey } = require('../hangul.js');

// Types Latin keystrokes as they would be pressed on a QWERTY keyboard; '<' is backspace.
function typed(keys) {
  const composer = new HangulComposer();
  let done = '';
  for (const key of keys) {
    if (key === '<') {
      if (composer.preedit) composer.backspace();
      else done = done.slice(0, -1);
    } else if (key === ' ') {
      done += composer.preedit + ' ';
      composer.reset();
    } else {
      const shift = key !== key.toLowerCase();
      const { commit } = composer.type(jamoForKey(`Key${key.toUpperCase()}`, shift));
      done += commit;
    }
  }
  return done + composer.preedit;
}

const CASES = {
  'greeting and a space': ['dkssud gktpdy', '안녕 하세요'],
  'whole greeting': ['dkssudgktpdy', '안녕하세요'],
  'thanks, compound vowel': ['rkatkgkqslek', '감사합니다'],
  'korea': ['gksrnr', '한국'],
  'final consonant moves to next syllable': ['rksk', '가나'],
  'compound final splits on vowel': ['rkqtk', '갑사'],
  'compound final stays': ['ekfr', '닭'],
  'compound vowels': ['ghk', '화'],
  'compound vowel plus final': ['dnjs', '원'],
  'shifted double consonant': ['Rk', '까'],
  'shifted double as final': ['dlT', '있'],
  'shifted vowel': ['dO', '얘'],
  'shift on key with no double': ['Gk', '하'],
  'double consonant cannot be a final': ['rkEk', '가따'],
  'lone consonants': ['rt', 'ㄱㅅ'],
  'lone vowels': ['kj', 'ㅏㅓ'],
  'vowel then consonant': ['kr', 'ㅏㄱ'],
  'non-compounding final starts a new syllable': ['rkrrk', '각가'],
  'backspace removes one jamo': ['gks<', '하'],
  'backspace through a syllable': ['gks<<', 'ㅎ'],
  'backspace to nothing': ['gks<<<', ''],
  'backspace splits compound vowel': ['ghk<', '호'],
  'backspace splits compound final': ['ekfr<', '달'],
  'backspace after a split': ['rkskk<', '가나'],
  'backspace past a committed syllable': ['rksk<<', '가'],
};

for (const [name, [keys, expected]] of Object.entries(CASES)) {
  test(name, () => assert.strictEqual(typed(keys), expected));
}

test('every syllable is NFC so DeepL sees normal text', () => {
  const text = typed('dkssudgktpdy');
  assert.strictEqual(text, text.normalize('NFC'));
});

test('non-letter keys are not mapped', () => {
  for (const code of ['Space', 'Enter', 'Digit1', 'Backspace', 'ArrowLeft']) {
    assert.strictEqual(jamoForKey(code, false), null);
  }
});
