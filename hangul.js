// Dubeolsik (standard 2-set) Hangul composition. No DOM access, so it can be unit tested in Node.
(() => {
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';

  const COMPOUND_JUNG = {
    'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ',
  };
  const COMPOUND_JONG = {
    'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
    'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ',
  };

  // Indexed by KeyboardEvent.code so the layout follows physical keys, whatever the OS layout is.
  const KEYS = {
    KeyQ: 'ㅂㅃ', KeyW: 'ㅈㅉ', KeyE: 'ㄷㄸ', KeyR: 'ㄱㄲ', KeyT: 'ㅅㅆ',
    KeyY: 'ㅛ', KeyU: 'ㅕ', KeyI: 'ㅑ', KeyO: 'ㅐㅒ', KeyP: 'ㅔㅖ',
    KeyA: 'ㅁ', KeyS: 'ㄴ', KeyD: 'ㅇ', KeyF: 'ㄹ', KeyG: 'ㅎ',
    KeyH: 'ㅗ', KeyJ: 'ㅓ', KeyK: 'ㅏ', KeyL: 'ㅣ',
    KeyZ: 'ㅋ', KeyX: 'ㅌ', KeyC: 'ㅊ', KeyV: 'ㅍ', KeyB: 'ㅠ', KeyN: 'ㅜ', KeyM: 'ㅡ',
  };

  function jamoForKey(code, shift) {
    const jamo = KEYS[code];
    if (!jamo) return null;
    return (shift && jamo[1]) || jamo[0];
  }

  function render({ cho, jung, jong }) {
    if (cho && jung) {
      const index = (CHO.indexOf(cho) * JUNG.length + JUNG.indexOf(jung)) * JONG.length
        + (jong ? JONG.indexOf(jong) : 0);
      return String.fromCharCode(0xac00 + index);
    }
    return cho || jung || '';
  }

  class HangulComposer {
    constructor() {
      this.reset();
    }

    reset() {
      // One snapshot per keystroke in the current syllable, so backspace removes a single jamo.
      this.steps = [];
    }

    get current() {
      return this.steps[this.steps.length - 1] || { cho: '', jung: '', jong: '', key: '' };
    }

    get preedit() {
      return render(this.current);
    }

    // Returns the text that is finished plus the syllable still being composed.
    type(jamo) {
      const { cho, jung, jong } = this.current;
      const isVowel = JUNG.includes(jamo);
      let next = null;

      if (isVowel) {
        if (jong) {
          // A vowel pulls the last final consonant into the next syllable: 간 + ㅏ = 가나.
          const moved = this.current.key;
          const commit = render(this.steps[this.steps.length - 2]);
          this.steps = [
            { cho: moved, jung: '', jong: '', key: moved },
            { cho: moved, jung: jamo, jong: '', key: jamo },
          ];
          return { commit, preedit: this.preedit };
        }
        if (!jung) next = { cho, jung: jamo, jong: '' };
        else if (COMPOUND_JUNG[jung + jamo]) next = { cho, jung: COMPOUND_JUNG[jung + jamo], jong: '' };
      } else if (cho && jung) {
        if (!jong && JONG.includes(jamo)) next = { cho, jung, jong: jamo };
        else if (jong && COMPOUND_JONG[jong + jamo]) next = { cho, jung, jong: COMPOUND_JONG[jong + jamo] };
      } else if (!cho && !jung) {
        next = { cho: jamo, jung: '', jong: '' };
      }

      if (next) {
        this.steps.push({ ...next, key: jamo });
        return { commit: '', preedit: this.preedit };
      }

      const commit = this.preedit;
      this.steps = [{ cho: isVowel ? '' : jamo, jung: isVowel ? jamo : '', jong: '', key: jamo }];
      return { commit, preedit: this.preedit };
    }

    backspace() {
      this.steps.pop();
      return this.preedit;
    }
  }

  const api = { HangulComposer, jamoForKey, KEYS };
  if (typeof module !== 'undefined') module.exports = api;
  else globalThis.HangulIME = api;
})();
