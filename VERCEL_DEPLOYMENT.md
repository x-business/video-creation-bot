# Vercel Deployment Guide

This guide will help you deploy your Video-Edit-Guide project to Vercel.

## ⚠️ Important Considerations

### 1. **File Storage Issue**
Your current setup uses local file storage (`data/storage.json`) which **will NOT work** on Vercel because:
- Vercel uses serverless functions (stateless)
- Files written to the filesystem are not persistent
- Each function invocation is isolated

### 2. **Solutions for Production**

You have several options:

#### Option A: Use a Database (Recommended)
- **PostgreSQL** (via Vercel Postgres, Supabase, or Neon)
- **MongoDB** (via MongoDB Atlas)
- Update `server/storage.ts` to use database instead of file storage

#### Option B: Use External Storage
- **Vercel Blob Storage** for file uploads
- **Cloudinary** or **AWS S3** for images/videos
- Keep using a database for project metadata

#### Option C: Use Vercel KV (Redis)
- For simple key-value storage
- Good for temporary data, but not ideal for complex queries

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

```
AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_key
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
HF_API_KEY=your_higgsfield_key
HF_API_SECRET=your_higgsfield_secret
NODE_ENV=production
PORT=3000
```

### 2. Update Storage Implementation
**Before deploying**, you need to replace the file-based storage with a database.

Example using PostgreSQL with Drizzle (you already have drizzle-orm installed):

```typescript
// server/storage.ts - Update to use database
import { db } from './db'; // Your database connection
import { videoProjects } from '@shared/schema';

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<VideoProject[]> {
    return await db.select().from(videoProjects);
  }
  
  async createProject(project: InsertVideoProject): Promise<VideoProject> {
    const [created] = await db.insert(videoProjects).values(project).returning();
    return created;
  }
  
  // ... implement other methods
}
```

### 3. File Uploads
The `uploads/` directory won't persist on Vercel. Options:
- Use **Vercel Blob Storage**
- Use **Cloudinary** or **AWS S3**
- Store file URLs in database instead of local paths

### 4. Build Configuration
The `vercel.json` is already configured, but you may need to adjust:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public"
}
```

## 🚀 Deployment Steps

### Method 1: GitHub Integration (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"

3. **Import Repository**:
   - Select your GitHub repository
   - Vercel will auto-detect settings from `vercel.json`

4. **Configure Environment Variables**:
   - In project settings, add all required environment variables
   - See "Environment Variables" section below

5. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **For production**:
   ```bash
   vercel --prod
   ```

## 🔧 Required Changes Before Deployment

### 1. Update `server/storage.ts`
Replace `LocalFileStorage` with a database-backed storage:

```typescript
// Use PostgreSQL, MongoDB, or another database
// Example with Drizzle ORM (you already have it)
```

### 2. Update File Upload Handling
In `server/routes.ts`, change file uploads to use external storage:

```typescript
// Instead of saving to local 'uploads/' directory
// Upload to Vercel Blob, Cloudinary, or S3
```

### 3. Update Build Script
Ensure `script/build.ts` builds both frontend and backend correctly.

## 📝 Environment Variables in Vercel

Go to: **Project Settings → Environment Variables**

Add all required variables (for Production, Preview, and Development):

### Required Variables:
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Your OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL (default: `https://api.openai.com/v1`)
- `HF_API_KEY` - Higgsfield API key
- `HF_API_SECRET` - Higgsfield API secret
- `NODE_ENV` - Set to `production`

### Optional (if using database):
- `DATABASE_URL` - Your database connection string (PostgreSQL, MongoDB, etc.)

### How to Add:
1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable with its value
4. Select which environments to apply to (Production, Preview, Development)
5. Click **Save**
6. Redeploy your project for changes to take effect

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Check that build output includes all necessary files

### Issue: API routes not working
- Verify `vercel.json` routes configuration
- Check that API routes are in `server/` directory
- Ensure serverless function timeout is sufficient (max 60s on free tier)

### Issue: Static files not serving
- Check `outputDirectory` in build config
- Verify `dist/public` contains built files
- Check Vercel build logs

### Issue: Storage not persisting
- **This is expected** - you must use a database or external storage
- Local file storage will not work on Vercel

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

## ⚡ Quick Start (After Storage Migration)

Once you've migrated to a database:

1. Set environment variables in Vercel
2. Push code to GitHub
3. Connect repository to Vercel
4. Deploy!

The `vercel.json` file is already configured for your project structure.
