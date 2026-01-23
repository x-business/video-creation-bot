# Local Development Setup Guide

This guide will help you set up and run the VideoFlow project on your local machine after migrating from Replit.

## Prerequisites

1. **Node.js** (v18 or higher recommended)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## Installation Steps

### 1. Install Dependencies

Open a terminal in the project root directory and run:

```bash
npm install
```

**Note**: The project uses `dotenv` to load environment variables from the `.env` file. This is automatically configured in the server code.

This will install all required dependencies including the newly added `cross-env` package for Windows compatibility.

### 2. Set Up Environment Variables

Create a `.env` file in the project root directory:

```bash
# On Windows PowerShell
Copy-Item .env.example .env

# On Windows CMD
copy .env.example .env

# On Mac/Linux
cp .env.example .env
```

Then edit the `.env` file and configure the following:

#### Required for AI Features:
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Your OpenAI API key
  - Get one from: https://platform.openai.com/api-keys
  - Required for script generation and other AI features

- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL
  - Default: `https://api.openai.com/v1`
  - Usually you can leave this as-is unless using a proxy

#### Optional - Higgs Field API (for image/video/voice generation):
- `HIGGS_FIELD_API_KEY`: Your Higgs Field API key
  - Get one from: https://higgsfield.ai (or your Higgs Field provider)
  - Required for image, video, and voice generation features

- `HIGGS_FIELD_BASE_URL`: Higgs Field API base URL
  - Default: `https://api.higgsfield.ai`
  - Update if using a different endpoint

#### Optional:
- `PORT`: Server port (defaults to 5000 if not set)
- `NODE_ENV`: Set to `development` for dev mode, `production` for production
- `DATABASE_URL`: Only needed if you want to use PostgreSQL instead of in-memory storage

### 3. Run the Development Server

Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

You should see output like:
```
serving on port 5000
```

### 4. Access the Application

Open your browser and navigate to:
- **Local**: http://localhost:5000

## Project Structure

- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript types and schemas
- `attached_assets/` - Static assets

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server (after building)
- `npm run check` - Type-check TypeScript code
- `npm run db:push` - Push database schema changes (requires DATABASE_URL)

## Current Storage

**Important**: The app currently uses **in-memory storage** by default. This means:
- Data is stored in memory and will be lost when the server restarts
- No database setup is required to get started
- Perfect for development and testing

If you want persistent storage, you'll need to:
1. Set up a PostgreSQL database
2. Set `DATABASE_URL` in your `.env` file
3. Update `server/storage.ts` to use Drizzle ORM instead of `MemStorage`

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, change the `PORT` in your `.env` file to a different port (e.g., `3000`, `8000`).

### OpenAI API Errors
- Verify your API key is correct in `.env`
- Check that you have credits/quota in your OpenAI account
- Ensure `AI_INTEGRATIONS_OPENAI_BASE_URL` is set correctly

### Windows-Specific Issues
- The project now uses `cross-env` for cross-platform compatibility
- If you encounter issues with scripts, make sure you've run `npm install` to get the latest dependencies

### Module Not Found Errors
- Run `npm install` again to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` to do a fresh install

## Differences from Replit

1. **Replit Plugins**: The Replit-specific Vite plugins are automatically disabled when `REPL_ID` is not set, so they won't interfere with local development.

2. **Environment Variables**: In Replit, environment variables were set in the Replit dashboard. Locally, you need to create a `.env` file.

3. **Port Configuration**: Replit automatically handles port configuration. Locally, you need to set the `PORT` environment variable or it defaults to 5000.

4. **Database**: The project is configured to work with in-memory storage by default, so no database setup is required initially.

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Create `.env` file with your OpenAI API key
3. ✅ Run `npm run dev`
4. ✅ Open http://localhost:5000 in your browser

Enjoy developing locally! 🚀
