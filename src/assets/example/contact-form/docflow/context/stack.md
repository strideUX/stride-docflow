# Technical Stack

## Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation
- **Components**: shadcn/ui
- **Icons**: Lucide React

## Backend
- **Database**: Convex
- **Type Safety**: End-to-end TypeScript with Convex
- **Real-time**: Convex subscriptions (if needed)
- **File Storage**: N/A for this project

## Infrastructure
- **Hosting**: Vercel
- **Database Hosting**: Convex Cloud
- **Monitoring**: Vercel Analytics (basic)
- **Error Tracking**: Console logs for now

## Development
- **Language**: TypeScript (strict mode)
- **Package Manager**: npm
- **Testing**: Jest + React Testing Library (future)
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky (future)

## Key Patterns
- Server Components by default, Client Components when needed
- Form validation on client and server
- Optimistic UI updates where applicable
- Error boundaries on routes
- Loading states for all async operations