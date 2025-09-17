# Coding Standards

## General Principles
- **DRY**: Don't repeat yourself - check dependencies.md first
- **KISS**: Keep it simple - avoid over-engineering
- **Type Safety**: TypeScript strict mode, no `any` types
- **Error Handling**: All async operations have proper error handling
- **Accessibility First**: WCAG 2.1 AA compliance

## Code Organization
```
/src
├── /app                  # Next.js app router
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page with form
├── /components
│   ├── /ui              # shadcn/ui components
│   └── /features        # Feature components (ContactForm)
├── /lib                 # Utilities
│   └── utils.ts         # Helper functions
├── /hooks               # Custom React hooks
└── /types               # TypeScript types
/convex
├── schema.ts            # Database schema
└── messages.ts          # Message mutations/queries
```

## Naming Conventions
- **Components**: PascalCase (e.g., `ContactForm`)
- **Files**: kebab-case (e.g., `contact-form.tsx`)
- **Functions**: camelCase (e.g., `submitMessage`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_MESSAGE_LENGTH`)
- **Convex Functions**: camelCase (e.g., `createMessage`)

## Component Standards
- Functional components only
- Props interface defined above component
- Use `'use client'` directive only when necessary
- Colocate styles in component files (Tailwind)

## Convex Standards
- Schema defined with proper types
- Validators for all mutations
- Separate files for different resource types
- Use Convex's built-in auth when needed

## Form Standards
- Client-side validation with Zod
- Server-side validation in Convex mutations
- Proper error messages for all fields
- Loading states during submission
- Success feedback after submission

## Git Conventions
- **Branch naming**: `type/description` (e.g., `feature/contact-form`)
- **Commit format**: `type: description` (e.g., `feat: add contact form`)
- **PR size**: Aim for < 400 lines changed

## Performance Standards
- Lighthouse score > 95
- Form submission < 2 seconds
- Proper loading states
- No layout shifts

## Security Standards
- Input sanitization
- Rate limiting on form submission
- Honeypot field for spam prevention
- Environment variables for secrets
- No sensitive data in client code

## Accessibility Standards
- Semantic HTML
- Proper form labels
- Error messages associated with fields
- Keyboard navigation support
- Focus management
- Screen reader tested