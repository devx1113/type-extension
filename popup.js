const radios = document.querySelectorAll('input[name="language"]');

chrome.storage.local.get({ settings: { language: 'ko' } }, ({ settings }) => {
  for (const radio of radios) radio.checked = radio.value === settings.language;
});

for (const radio of radios) {
  radio.addEventListener('change', () => {
    chrome.storage.local.set({ settings: { language: radio.value, writer: 'popup' } });
  });
}
