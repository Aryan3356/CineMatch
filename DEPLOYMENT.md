# Deploying CineMatch on Render

## Render Web Service Settings

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

## Environment Variables on Render

Add these in Render Dashboard > Environment:

```text
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/movierecommender?retryWrites=true&w=majority
```

Do not upload your local `.env` file. Render provides `PORT` automatically, and `server.js` reads it with `process.env.PORT`.

## MongoDB Atlas

Create an Atlas cluster, create a database user, copy the Node.js driver connection string, and use it as `MONGO_URI`.

In Atlas Network Access, allow your Render service to connect. For a class project, allowing `0.0.0.0/0` is the simplest option, but it is less secure. A better option is adding the outbound IP addresses shown by your Render service.

## Seed Data on Atlas

After setting `backend/.env` locally to your Atlas `MONGO_URI`, run:

```bash
cd backend
node seed.js
```

Or, if you only need to add/update Indian movies:

```bash
node addIndianMovies.js
```
