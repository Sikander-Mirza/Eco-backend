// server.cjs  — CJS bootstrap for cPanel/lsnode
(async () => {
  try {
    // Import your real ESM entry (adjust filename if needed)
    const mod = await import('./server.js');

    // 1) If your ESM exports a function that starts the app, call it
    if (typeof mod.default === 'function') {
      const maybeApp = await mod.default();
      // If that function returned an Express app, attach the listener
      if (maybeApp && typeof maybeApp.listen === 'function') {
        const PORT = process.env.PORT || 3000;
        maybeApp.listen(PORT, () =>
          console.log(`✅ App listening on ${PORT} (via default())`)
        );
      }
      return;
    }

    // 2) If your ESM exports an Express app (named or default), listen on it
    const app = mod.app || mod.default;
    if (app && typeof app.listen === 'function') {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () =>
        console.log(`✅ App listening on ${PORT} (via exported app)`)
      );
      return;
    }

    console.warn('⚠️ server.js imported but no starter/app was found.');
  } catch (err) {
    console.error('❌ Bootstrap import failed:', err);
  }
})();
