const radios = document.querySelectorAll('input[name="language"]');

function showLanguage(language) {
  for (const radio of radios) radio.checked = radio.value === language;
}

chrome.storage.local.get({ settings: { language: 'ko' } }, ({ settings }) => showLanguage(settings.language));
chrome.storage.onChanged.addListener(({ settings }) => {
  if (settings && settings.newValue) showLanguage(settings.newValue.language);
});

for (const radio of radios) {
  radio.addEventListener('change', () => {
    chrome.storage.local.set({ settings: { language: radio.value, writer: 'popup' } });
  });
}

chrome.commands.getAll((commands) => {
  const toggle = commands.find((command) => command.name === 'toggle-language');
  document.getElementById('shortcut').textContent = (toggle && toggle.shortcut) || 'Not set';
});

document.getElementById('change-shortcut').addEventListener('click', (event) => {
  event.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
