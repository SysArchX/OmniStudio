# OmniStudio

Desktop and web workspace with a chat that rotates between free AI providers, a 2D video studio for vertical clips, and an agent that edits files and runs commands.

Built by [SysArchX](https://github.com/SysArchX). Interface and generated content are in Brazilian Portuguese.

## What it does

- **Chat** with Groq, OpenRouter and GitHub Models in automatic rotation. When one provider hits a rate limit, the next one answers. Without any key it falls back to a local, rule based reply engine.
- **Web research without an API key.** One button searches Portuguese and English Wikipedia plus DuckDuckGo. Any link pasted into the chat is fetched and summarized through the Jina Reader.
- **Agent mode.** Plans the task as a checklist, then reads, creates and edits files. In the desktop app it also runs terminal commands and reads the output to fix what failed. Skills come from a `.agents/skills` folder or from an imported `SKILL.md`.
- **Video studio.** Vector 2D animation on HTML5 canvas at 720x1280, captions of at most three words, and export through `MediaRecorder` at a fixed 30 FPS. Only Brazilian Portuguese voices are accepted.
- **Optional Google sign in** through Supabase, with settings, conversations and keys synced to your own project. Local mode needs no account.

## Install

Download from the [releases page](https://github.com/SysArchX/OmniStudio/releases/latest):

| File | Platform |
| --- | --- |
| `OmniStudio-Setup.exe` | Windows 10 and 11 |
| `OmniStudio.deb` | Debian, Ubuntu |
| `OmniStudio.pacman` | Arch Linux |
| `OmniStudio.apk` | Android 7.0+ |

The Arch package is built from `packaging/arch/PKGBUILD`. After downloading:

```bash
sudo pacman -U OmniStudio.pacman
```

## Run from source

```bash
git clone https://github.com/SysArchX/OmniStudio.git
cd OmniStudio
npm ci
npm run dev      # http://localhost:3100
```

Requirements: Node.js 20 or newer.

## Provider keys

All three providers have a free tier. Keys stay in the browser localStorage of your machine unless you enable Supabase sync.

### Groq

1. Open [console.groq.com/keys](https://console.groq.com/keys).
2. Sign in with Google or GitHub.
3. Click **Create API Key**, name it `omnistudio`, copy the value.
4. In OmniStudio open **Configurações > Chaves de API**, paste it in the Groq field and press **Testar**.

The model used is `llama-3.3-70b-versatile`.

### OpenRouter

1. Open [openrouter.ai/keys](https://openrouter.ai/keys).
2. Create an account with Google or GitHub.
3. Click **Create Key**, copy the value.
4. Paste it in the OpenRouter field and press **Testar**.

The app requests `openrouter/free`. If that route is unavailable on your account, it retries with a free model explicitly, so the test still tells you whether the key works.

### GitHub Models

1. Open [github.com/settings/tokens](https://github.com/settings/tokens).
2. Create a fine grained token with no extra scopes. GitHub Models only needs a valid GitHub identity.
3. Copy the token and paste it in the GitHub Models field.
4. Press **Testar**.

Calls go to `https://models.github.ai/inference/chat/completions` with `openai/gpt-4o-mini`.

## Google sign in with Supabase

Sign in is optional. Without it the app runs without an account and keeps data in the browser.

The short version:

1. Create a project at [supabase.com](https://supabase.com/dashboard) and run [`supabase-schema.sql`](supabase-schema.sql) in the SQL Editor.
2. Create an OAuth client in Google Cloud, type **Web application**, with the redirect URI `https://YOUR-REF.supabase.co/auth/v1/callback`.
3. Enable Google under **Authentication > Providers** in Supabase and paste the client id and secret.
4. Add `http://localhost:3100`, the deployed URL and `omnistudio://auth/callback` under **Authentication > URL Configuration > Redirect URLs**.
5. In OmniStudio open **Configurações > Conta e nuvem**, paste the project URL and the anon key, then press **Entrar com Google**.

The full walkthrough, with the Google Cloud screens, the testing mode caveat and a troubleshooting table, is in [`docs/google-login-setup.md`](docs/google-login-setup.md).

The desktop app registers the `omnistudio://` scheme in the Electron main process and forwards the callback to the renderer. The Android build needs the same scheme in an intent filter inside `android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="false">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="omnistudio" android:host="auth" />
</intent-filter>
```

## Web research

The chat has a **Pesquisa Web** button. It runs three requests in parallel and merges the results:

- `pt.wikipedia.org` and `en.wikipedia.org` search API, which allows cross origin requests
- `html.duckduckgo.com` through the Jina Reader proxy

Pasting a `http://` or `https://` link in the message reads that page before answering. No key, no paid service.

## Agent mode

Browser version:

- Uses the File System Access API (`showDirectoryPicker`). Pick a folder, and the agent can list, read and write files inside it. Paths with `..` are rejected.
- Terminal commands are disabled because the browser cannot spawn processes.

Desktop version:

- Full filesystem access through IPC handlers in `electron/main.cjs`.
- Terminal with an allowlist: `python`, `python3`, `node`, `npm`, `npx`, `git`, `ls`, `dir`, `cat`, `pacman`, `apt`, `arduino-cli`. Shell chaining characters (`;`, `&`, `|`, `>`, `<`, backtick, `$`) are refused.

Skills:

- Place folders under `.agents/skills/<name>/SKILL.md` inside the chosen workspace and the agent loads them on start.
- Or import a single `SKILL.md` from the interface.

## Video studio

- Canvas 720x1280, 30 FPS, drawn with 2D vectors. No WebGL and no Three.js.
- Five scenarios (jungle with quicksand, deep ocean, urban storm, arctic, minimal studio) and six character animations.
- Captions are shown three words at a time, with the active word in yellow and a black outline.
- Voice filter accepts only `pt-BR` voices (Microsoft Antonio, Microsoft Francisca, Google Portuguese Brazil, Luciana). English and European Portuguese voices are discarded.
- Export uses `canvas.captureStream(30)` plus `MediaRecorder` at 14 Mbps. The browser speech synthesis track is not captured by `MediaRecorder`, so the exported file carries the 2D scene, captions and synthesized sound effects. For narration in the final file, upload your own audio in the studio panel.

## Build the installers

```bash
npm run build              # static export in out/
npx electron-builder --win nsis
npx electron-builder --linux deb
npx electron-builder --linux pacman
npx cap add android && npx cap sync android && cd android && ./gradlew assembleRelease
```

The workflow [`.github/workflows/build-releases.yml`](.github/workflows/build-releases.yml) runs all four builds on tags `v*` and publishes them as release assets. It needs no secrets for unsigned builds. Add `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` and `KEY_PASSWORD` if you want a signed APK.

## Project layout

```
app/                 Next.js App Router entry and global styles
components/          shell, UI primitives and the five views
lib/ai.ts            provider rotation, web search, link reader
lib/auth.ts          Supabase auth over REST, deep link callbacks
lib/agent.ts         plan and tool loop, workspace files, skills
lib/scene2d.ts       vector scenarios, character and animations
lib/video-render.ts  frame composition, captions, 30 FPS recording
electron/            main process, protocol handler, IPC bridge
packaging/arch/      PKGBUILD
supabase-schema.sql  tables, policies and signup trigger
```

## Limits

- The browser build cannot run terminal commands.
- Speech synthesis is not part of the recorded video file.
- Internet free tiers change without notice. When a provider retires a model, the error message in **Configurações > Testar** shows exactly what the provider refused.

## License

MIT.
