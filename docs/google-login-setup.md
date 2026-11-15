# Google sign in setup

OmniStudio signs users in with Google through your own Supabase project. Nothing is shared with a third party server: the app talks to the Supabase URL you provide, using the public anon key, and Supabase runs the OAuth exchange.

This guide takes about five minutes. You need a Google account and a Supabase account, both free.

## 1. Create the Supabase project

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**, choose an organization, type a name and a database password, pick the region closest to you and confirm.
3. Wait until the project status turns green. It takes one or two minutes.

## 2. Create the database tables

1. In the project sidebar open **SQL Editor** and click **New query**.
2. Open [`supabase-schema.sql`](../supabase-schema.sql) from this repository, copy the whole file and paste it into the editor.
3. Click **Run**. The output should say `Success. No rows returned`.

That creates four tables (`profiles`, `app_settings`, `conversations`, `api_keys`), the row level security policies that limit every row to its owner, and the trigger that creates a profile when a user signs up.

## 3. Create the Google OAuth client

Google is where the identity comes from, Supabase is where it lands. The client belongs to Google Cloud, and Supabase needs its id and secret.

1. Open [console.cloud.google.com](https://console.cloud.google.com) and create a project, or select an existing one.
2. Open **APIs & Services > OAuth consent screen**. Choose **External**, fill the app name, your support email and the developer email, then save. You can leave the app in **Testing** mode while you build. In testing, only the Google accounts you add under **Test users** can sign in.
3. Open **APIs & Services > Credentials > Create credentials > OAuth client ID**.
4. Application type: **Web application**.
5. Name: `OmniStudio`.
6. Under **Authorized redirect URIs** click **Add URI** and paste the Supabase callback, replacing the project reference:

   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```

   The project reference is the subdomain of your project URL, for example `abcdefghijklmnopqrst`.
7. Click **Create**. Copy the **Client ID** and the **Client secret**. The secret is shown only once in this dialog, but you can regenerate it later.

Google does not need your app URL at this step. The browser always returns to Supabase, and Supabase returns to the app.

## 4. Enable Google in Supabase

1. In the Supabase dashboard open **Authentication > Providers**.
2. Find **Google** in the list and enable it.
3. Paste the **Client ID** and the **Client secret** from step 3 and save.

While you are in the Authentication section, open **Authentication > Providers > Email** and keep email sign in disabled if you only want Google accounts. This is optional.

## 5. Allow the app URLs

Supabase refuses to redirect to an address that is not on its allowlist. This is the single most common reason a Google button appears to do nothing.

1. Open **Authentication > URL Configuration**.
2. Set **Site URL** to the main address of the app:

   ```
   https://site-18ac632e87d148d6ac36f5819bc6945b.freebuff.page
   ```

   If you run it elsewhere, use that address instead. Local development uses `http://localhost:3100`.

3. Under **Redirect URLs** add every address the app can return from:

   ```
   http://localhost:3100
   https://site-18ac632e87d148d6ac36f5819bc6945b.freebuff.page
   omnistudio://auth/callback
   ```

   The `omnistudio://` entry is what makes sign in work inside the desktop build and the Android build. Web only needs the https entry.

4. Save.

## 6. Connect the app

1. In Supabase open **Project Settings > API** (older dashboards: **Settings > API**).
2. Copy **Project URL** and the **anon** `public` key. Do not copy the `service_role` key into a client app.
3. In OmniStudio open **Configurações**, tab **Conta e nuvem**, paste both values and press **Entrar com Google**, or reload and use the button on the first screen.
4. The browser opens Google, you pick an account, and Supabase redirects back. The app reads the token from the URL fragment, fetches the profile and stores the session locally.

## Where the values live

The project URL and anon key are stored in the browser `localStorage` under `omnistudio.settings.v1`. The session is stored under `omnistudio.session.v1`. Nothing is written to a server you do not own. Use **Sair** in Configurações to revoke the session and clear it.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Click does nothing, no browser window | No project URL or anon key in Configurações | Fill both fields, save, click again |
| Supabase error page: `redirect_uri_mismatch` | Google client does not list the Supabase callback | Add `https://YOUR-REF.supabase.co/auth/v1/callback` to the Google client redirect URIs |
| Supabase error page: `Invalid redirect URL` or the app returns with no session | App origin missing from Supabase Redirect URLs | Add the exact origin, including scheme, to Authentication > URL Configuration |
| `Unsupported provider: provider is not enabled` | Google not enabled in Supabase | Authentication > Providers > Google, paste id and secret, save |
| Google says the app is not verified | Consent screen still in Testing | Add your Google account under Test users, or publish the consent screen |
| Desktop app stays on the loading screen after the browser closes | The `omnistudio://` callback is not registered | Install the packaged build from the releases page. The scheme is registered by the installer, not by a dev server |
| Android does not return to the app | Missing intent filter | Add the `omnistudio://auth` intent filter described in the README |
| Data does not sync after login | Schema not applied, or RLS blocked the row | Re-run `supabase-schema.sql` and check the browser network tab for 401 or 403 |

## Checking the setup without the app

Two requests tell you whether the project is ready:

```bash
# health of the auth endpoint, 200 means the project exists
curl -s -o /dev/null -w "%{http_code}\n" https://YOUR-REF.supabase.co/auth/v1/health

# provider list, look for "google": true
curl -s https://YOUR-REF.supabase.co/auth/v1/settings -H "apikey: YOUR-ANON-KEY"
```

If the second call shows `"google": false`, the provider is still disabled.
