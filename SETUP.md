# Sensly — Setup Guide

Two people can work in parallel after completing their respective setup steps.

---

## Person B (Backend) — Do this first

### 1. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `sensly` | Region: pick closest to you | Generate a strong password
3. Wait ~2 minutes for provisioning

### 2. Run the schema
1. In Supabase dashboard → **SQL Editor** → New query
2. Open `supabase/schema.sql` from this repo
3. Paste the entire file → **Run**
4. You should see all tables created with no errors

### 3. Get your project credentials
In Supabase dashboard → **Project Settings** → **API**:
- `Project URL` → this is your `SUPABASE_URL`
- `anon public` key → this is your `SUPABASE_ANON_KEY`
- `service_role` key → keep this secret, only used in Edge Functions

### 4. Create the `.env` file
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GROQ_API_KEY=your-groq-key-here
```
Get a free Groq API key at [console.groq.com](https://console.groq.com)

### 5. Share credentials with Person A
Send them:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

They do NOT need the service role key or Groq key.

### 6. Generate TypeScript types (optional but recommended)
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```
Share the generated `src/types/supabase.ts` with Person A so their stores are typed correctly.

---

## Person A (Frontend) — Do this in parallel

### 1. Scaffold the Expo project
```bash
npx create-expo-app sensly --template blank-typescript
cd sensly
```

### 2. Install all dependencies
Copy `package.json` from this repo into the project root, then:
```bash
npm install
```

### 3. Add environment variables
Create `.env` in the project root (get values from Person B):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Test on your phone
```bash
npx expo start
```
Install **Expo Go** on your phone → scan the QR code.

### 5. Set up folder structure
```
src/
  components/
  stores/
  hooks/
  lib/
  types/
  constants/
  locales/
supabase/
  functions/
```

---

## Supabase Auth Setup (Person B)

In Supabase dashboard → **Authentication** → **Providers**:
- Email: enabled (default)
- Google: enable if time allows (requires Google Cloud Console OAuth credentials)
- Apple: enable if time allows (requires Apple Developer account)

For hackathon: email auth is sufficient.

---

## Edge Functions Setup (Person B)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Deploy a function
supabase functions deploy detect-patterns
supabase functions deploy generate-insights
supabase functions deploy moderate-comment
```

Edge Function files go in `supabase/functions/<function-name>/index.ts`

---

## Coordination Contract

Once Supabase is running, Person A can start writing stores and hooks immediately.
The key shared contract is the table schema — both people should treat `supabase/schema.sql` as the source of truth.

If Person B needs to change the schema, communicate it to Person A before running migrations.
