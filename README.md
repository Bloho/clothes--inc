# Clothes, Inc

Minimal online wardrobe app built with Next.js.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Google Sign-In

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

```bash
AUTH_SECRET="use-a-long-random-string"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

In Google Cloud Console, add this OAuth redirect URI:

```text
http://localhost:3000/api/auth/google/callback
```

Each Google email gets a separate signed session and wardrobe store.

## Storage

This local build stores user data on disk:

- metadata: `data/users/<user-id>/wardrobe.json`
- uploads: `public/uploads/<user-id>/...`

For production deployment, move those to a real database and object storage.

## Optional AI Sorting

Manual category sorting works by default. To let the upload API classify clothing images, set:

```bash
OPENAI_API_KEY="..."
OPENAI_CLOTHING_MODEL="gpt-5.4-mini"
```

If the AI sorter is unavailable or fails, the selected upload category is used.
