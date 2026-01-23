# VideoFlow - AI Video Workflow Automation

## Overview

VideoFlow is a web application for automating short-form video creation workflows. It helps users organize and track video projects across platforms like TikTok, Instagram Reels, and YouTube Shorts. The app provides AI-powered script generation using OpenAI and guides users through a structured workflow including hook generation, scripting, image creation, video production, audio generation, and final editing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with hot module replacement

The frontend follows a component-based architecture with pages in `client/src/pages/` and reusable components in `client/src/components/`. UI primitives are in `client/src/components/ui/`.

### Backend Architecture
- **Framework**: Express.js (v5) running on Node.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API with `/api/` prefix
- **Build**: esbuild for production bundling

Routes are registered in `server/routes.ts`. The server serves the Vite dev server in development and static files in production via `server/static.ts`.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod
- **Current Storage**: In-memory storage implementation in `server/storage.ts` (ready to switch to PostgreSQL)

The main data model is `videoProjects` which tracks video creation workflow status including platform, tone, purpose, script content, and completion flags for each workflow step.

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations
- **Features**: Script generation, image generation, chat, voice/audio processing
- **Integration Files**: Located in `server/replit_integrations/` with modules for audio, chat, image generation, and batch processing

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations and schema push (`npm run db:push`)

### AI Services
- **OpenAI API**: Used through Replit AI Integrations for script generation and content creation
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Third-Party Integrations
- **transitionalhooks.com**: External service for generating video hooks (referenced in workflow documentation)
- **Higgs Field**: External AI tool for image/video/voice generation (workflow documentation)
- **ElevenLabs**: Voice generation alternative (workflow documentation)
- **CapCut**: Video editing tool (workflow documentation)

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `express`: Web server framework
- `openai`: AI integration client
- `zod`: Runtime validation
- Radix UI primitives: Accessible UI components