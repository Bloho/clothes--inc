# Clothes, Inc

Minimal online wardrobe app built with Next.js, Google OAuth, Neon/Postgres, and Vercel Blob.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Set these in `.env.local` for development and in Vercel Project Settings -> Environment Variables for production:

```bash
AUTH_SECRET="use-a-long-random-string"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
DATABASE_URL="postgresql://..."
BLOB_READ_WRITE_TOKEN="..."
```

Optional AI sorting:

```bash
OPENAI_API_KEY="..."
OPENAI_CLOTHING_MODEL="gpt-5.4-mini"
```

## Google Sign-In

In Google Cloud Console, add both redirect URIs:

```text
http://localhost:3000/api/auth/google/callback
https://clothes-inc.vercel.app/api/auth/google/callback
```

Each Google email gets a separate signed session and database user record.

## Production Storage

The app stores durable data in two places:

- Neon/Postgres via `DATABASE_URL`
- Vercel Blob via `BLOB_READ_WRITE_TOKEN`

Tables are created automatically on first use:

- `users`
- `wardrobe_items`

Uploaded files go directly from the browser to Vercel Blob. The app stores the resulting Blob URL and pathname in Postgres.

## Vercel Setup

1. In Vercel, open the project.
2. Go to Storage and create/connect a Blob store.
3. Ensure `BLOB_READ_WRITE_TOKEN` is available to Production and Preview.
4. Add a Neon Postgres integration from the Vercel Marketplace, or create a Neon database and copy its connection string.
5. Set `DATABASE_URL` to the Neon connection string.
6. Set `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
7. Redeploy.

## Upload Flow

1. User signs in with Google.
2. User chooses an image.
3. Browser uploads the image directly to Vercel Blob.
4. The API saves item metadata and the Blob URL to Postgres.
5. The wardrobe grid reads items from Postgres for the signed-in user only.

If AI sorting is unavailable or fails, the selected upload category is used.
