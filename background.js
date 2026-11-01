chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-language') return;
  const { settings } = await chrome.storage.local.get({ settings: { language: 'ko' } });
  const language = settings.language === 'ko' ? 'en' : 'ko';
  await chrome.storage.local.set({ settings: { language, writer: 'shortcut' } });
});
