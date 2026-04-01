# Jessy Speech Coach

Glass-dark React app for Jessy's daily speech support routines, word practice, imitation games, songs, and AI helper prompts.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Free GitHub Pages deployment

1. Create a GitHub repository and push this project.
2. Run:

   ```bash
   npm run deploy
   ```

3. In GitHub, open `Settings -> Pages`.
4. Set source to `gh-pages` branch (root).
5. Your site will be available at:
   - `https://<your-username>.github.io/<your-repo>/`

This project is configured with Vite `base: "./"` for simple static hosting.

## Multi-provider free API setup

The app supports runtime provider switching in the `AI Help` tab:

- `Offline` (no key required)
- `OpenRouter`
- `Groq`
- `Gemini OpenAI Compatible`

### How to use keys safely on GitHub Pages

1. Open `AI Help`.
2. Expand `API Settings`.
3. Choose provider and model.
4. Paste your API key into the key field.
5. Click `Test API`.

Keys are stored only in browser `localStorage` on your device and are never committed to the repository.

### Recommended free-tier models

- OpenRouter: `openrouter/auto` or a `:free` model
- Groq: `llama-3.1-8b-instant`
- Gemini-compatible: `gemini-2.0-flash`

### Troubleshooting

- `401`: Invalid API key
- `429`: Rate limited, try again later or switch provider/model
- Timeout or network error: app falls back to offline coach responses automatically

## Syllable Pop game (Pretext + Framer Motion)

The app now includes a `Games` tab with **Syllable Pop**:

- tap the next correct syllable bubble in order
- wrong taps or missed target bubbles reduce lives
- score increases for correct taps and completed words

### Why Pretext is used

`@chenglou/pretext` is used for fast, DOM-free text measurement so each bubble size is computed accurately before animation.

- stable bubble sizing on mobile/tablet
- no DOM measurement thrash during gameplay
- predictable multiline handling for longer syllables

## Google OAuth login and Drive sync (no Firebase)

This app now supports:

- Google OAuth login (client-side only)
- onboarding flow for API key setup
- optional Google Drive sync to hidden `appDataFolder`

### Setup Google OAuth client

1. Create an OAuth Client ID in Google Cloud Console (`Web application` type).
2. Add Authorized JavaScript origins:
   - local: `http://localhost:5173`
   - production: your GitHub Pages URL
3. No backend is required.

### Use in the app

1. Open onboarding (or click `Setup` in header).
2. Enter Google OAuth Client ID.
3. Sign in with Google.
4. Use `Sync now` to upload backup to Drive app data.
5. Use `Restore` to recover the latest backup.

### Privacy and storage

- API keys, auth metadata, and app state are stored in browser `localStorage`.
- Drive backups are stored in hidden `appDataFolder` and not shown in normal Drive files.
- Sign out clears the active token from local app state.

## Jessy speech analysis mode

`AI Help` now includes an **Analyze Jessy Speech** panel.

### Workflow

1. Record a short speech sample from Jessy.
2. Transcribe using Groq Whisper STT.
3. Review/edit transcript if needed.
4. Run analysis to get:
   - what she attempted
   - likely motor-planning pattern
   - what to model next
   - caregiver script

### Language support

- Telugu and English supported (`auto`, `te`, `en` in panel).
- Use clear audio for better transcription accuracy.

### Important note

- Analysis is supportive coaching guidance only.
- It is **not** a medical diagnosis.
