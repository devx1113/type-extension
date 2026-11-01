# DeepL Korean Typing

Type Korean on deepl.com with the standard 2-set (Dubeolsik) layout. No OS input method is needed.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Reload any open deepl.com tab.

## Use

- Korean is the default language. Type `dkssudgktpdy` to get 안녕하세요.
- Click the extension's toolbar icon to set the language to **Korean** or **English**. Open DeepL tabs update right away.
- **Alt+Shift+K** switches the language from anywhere in Chrome. Change it at `chrome://extensions/shortcuts`.
- On deepl.com, **Shift+Space**, the Hangul key, or the `한`/`A` button at the bottom right also switches it.
- The **Keys** button shows which key produces which letter.
- Hold Shift for double consonants and ㅒ/ㅖ, e.g. Shift+R for ㄲ.

Password and email fields are never converted.

## Test

    node --test test/hangul.test.js
