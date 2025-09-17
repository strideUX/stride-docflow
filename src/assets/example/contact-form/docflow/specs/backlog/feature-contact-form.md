# Feature: Contact Form

## Context
Create the main contact form functionality that allows users to submit messages. This includes the frontend form component, validation, Convex backend integration, and spam prevention measures.

## User Story
As a website visitor
I want to send a message through a contact form
So that I can get in touch with the site owner

## Acceptance Criteria
- [ ] Contact form displays with fields: name, email, subject, message
- [ ] Client-side validation shows inline errors
- [ ] Form submission shows loading state
- [ ] Success message appears after submission
- [ ] Form resets after successful submission
- [ ] Messages are stored in Convex database
- [ ] Honeypot field prevents basic spam
- [ ] Rate limiting prevents abuse (3 messages per email per hour)
- [ ] Form is fully accessible (keyboard nav, screen readers)
- [ ] Form is mobile responsive

## Technical Notes
### Approach
1. Create ContactForm component with React Hook Form
2. Implement Zod schema for validation
3. Add Convex schema for messages table
4. Create Convex mutation for message creation
5. Implement honeypot field (hidden from users)
6. Add rate limiting logic in Convex

### Components Needed
- ContactForm component
- FormField components (reusable)
- SuccessMessage component
- ErrorMessage component

### Data Model
```typescript
// Convex schema
messages: defineTable({
  name: v.string(),
  email: v.string(),
  subject: v.string(),
  message: v.string(),
  createdAt: v.number(),
  read: v.boolean(),
  spam: v.boolean(),
})
```

### API Endpoints
- `createMessage` mutation in Convex
- `getRecentMessagesByEmail` query for rate limiting

## Dependencies
- **Uses**: feature-setup (requires initialized environment)
- **Modifies**: None
- **Blocks**: feature-admin-dashboard (future)

## Decision Log
- 2024-12-28: Initial spec created
- 2024-12-28: Chose React Hook Form over Formik for better TypeScript support
- 2024-12-28: Decided on honeypot over CAPTCHA for better UX
- 2024-12-28: Rate limiting in Convex rather than edge middleware for simplicity