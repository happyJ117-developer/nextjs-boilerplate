# Apple-Style Community Design

**Date:** 2026-05-28

## Goal

Turn the current app into a private, member-only community that feels like an Apple product page while behaving like a Naver Cafe-style forum.

The MVP includes:

- Email + password sign-up and login
- Member-only access to all community content
- Multiple forum sections
- Post create, edit, delete
- Comment create, edit, delete
- A polished Apple-inspired visual system across every screen

## Product Scope

This is a focused community product, not a general social network.

### In Scope

- Private membership access
- Section-based forums
- Post and comment CRUD
- Author ownership checks
- Clean, premium UI with Apple-like spacing, typography, and motion
- A small fixed set of starter sections

### Out of Scope

- Public browsing without login
- Likes, reactions, bookmarks, follows
- Direct messages
- File uploads for MVP
- Search, sorting, pagination beyond the basics
- Nested comment threads
- Admin moderation console

## User Experience

### Authentication

- New users can sign up with email and password.
- Returning users sign in with email and password.
- After login, the user lands in the community sections area.
- If a logged-out user tries to access any community route, they are redirected to `/login`.

### Community Structure

The community is organized into sections that resemble a cafe board structure.

Recommended starter sections:

- `Announcements`
- `Free Board`
- `Q&A`
- `Resources`
- `Reviews`

All sections are member-only.

### Content Rules

- Only logged-in users can read posts and comments.
- Only the post author can edit or delete that post.
- Only the comment author can edit or delete that comment.
- Section list pages show the newest posts first.
- Post detail pages show the post first, then comments below.

## Information Architecture

### Routes

- `/signup`
- `/login`
- `/sections`
- `/sections/[slug]`
- `/posts/new?section=[slug]`
- `/posts/[id]`
- `/posts/[id]/edit`
- `/error`

### Primary Navigation

- Header with brand, section shortcuts, and user menu
- Section list sidebar or top rail depending on viewport
- Clear sign-out action in the user menu

### Home Behavior

- `/` redirects to `/sections`
- Unauthenticated access redirects to `/login`

## Visual Direction

The UI should feel like Apple, not like a generic admin panel.

### Design Principles

- Large whitespace
- Strong typography hierarchy
- Soft gradients and glass-like surfaces
- Minimal borders
- Rounded cards and buttons
- Gentle motion and subtle hover states
- High contrast, premium-looking layout

### Component Language

- Hero-style section header on the community landing page
- Card-based section and post lists
- Spacious editor forms
- Softly elevated comment blocks
- A restrained color palette with one dominant accent

### Layout System

- Desktop: centered content with a wide, airy main column and a supporting sidebar or rail
- Mobile: stacked sections, full-width cards, simplified navigation

## Data Model

### Existing Auth Models

Keep the Auth.js models already present:

- `User`
- `Account`
- `Session`
- `VerificationToken`

### New Fields

Add password login support to `User`:

- `passwordHash String?`

### New Models

#### `Section`

Represents a forum board.

Fields:

- `id`
- `name`
- `slug` unique
- `description`
- `sortOrder`
- `createdAt`
- `updatedAt`

#### `Post`

Represents a forum post.

Fields:

- `id`
- `sectionId`
- `authorId`
- `title`
- `content`
- `createdAt`
- `updatedAt`

Relations:

- `section -> Section`
- `author -> User`
- `comments -> Comment`

#### `Comment`

Represents a post comment.

Fields:

- `id`
- `postId`
- `authorId`
- `content`
- `createdAt`
- `updatedAt`

Relations:

- `post -> Post`
- `author -> User`

### Seed Data

Seed starter sections during setup or migration so the app works immediately after deploy.

## Authentication Design

### Recommended Approach

Use Auth.js with a credentials provider for email/password login.

Why:

- Fits the requested email login flow
- Avoids OAuth dependency issues
- Keeps session handling consistent with the current stack
- Works well with a Prisma-backed user table

### Sign-Up Flow

- User submits email and password on `/signup`
- Password is hashed before storage
- User record is created in Prisma
- User is redirected to `/login`

### Login Flow

- User submits email and password on `/login`
- Credentials provider validates the password hash
- A session cookie is issued
- User is redirected to `/sections`

### Password Rules

- Minimum length enforced on the server
- Store only a hash, never plaintext
- Use a modern password hashing library such as `bcryptjs` or `argon2`

## Permission Model

### Read Access

- Logged-in members can read all sections, posts, and comments

### Write Access

- Any logged-in member can create a post in a section
- Any logged-in member can create a comment on a post

### Ownership Checks

- Post edit/delete actions require `session.user.id === post.authorId`
- Comment edit/delete actions require `session.user.id === comment.authorId`

### Future Admin Role

The schema should leave room for an `admin` role later, but MVP behavior does not depend on it.

## Implementation Shape

### Server-First CRUD

Use server actions or route handlers for:

- sign-up
- post creation
- post update
- post delete
- comment creation
- comment update
- comment delete

This keeps the UI simple and reduces client-side state complexity.

### Page Data Loading

- Section pages fetch posts for one section
- Post detail pages fetch post plus comment list
- The login and sign-up pages remain lightweight and focused

## Error Handling

- Invalid login shows a friendly auth error state
- Duplicate email on sign-up returns a clear message
- Unauthorized edit/delete requests are rejected
- Missing section or post renders a not-found state
- Empty content is blocked before persistence

## Accessibility

- Forms must have labels
- Buttons need clear text and keyboard focus states
- Contrast must remain readable on light surfaces
- The layout must work on desktop and mobile

## Testing Strategy

### Build-Level Checks

- Production build must pass without requiring hidden local-only env files
- Auth and community routes must compile cleanly

### Behavior Checks

- Sign-up creates a user with a password hash
- Login succeeds with a valid password and fails with an invalid password
- Logged-out users cannot access section or post pages
- Post authors can edit/delete their own posts
- Comment authors can edit/delete their own comments
- Non-authors cannot edit/delete content they do not own

## Rollout Plan

1. Add password-based auth and signup
2. Add section, post, and comment schema
3. Build private section browsing
4. Build post detail and comment flows
5. Apply Apple-style visual system across all pages
6. Verify with a production build and manual smoke test

## Success Criteria

The work is complete when:

- Users can sign up with email and password
- Users can log in with email and password
- All community content is member-only
- The app supports multiple sections
- Posts and comments support create/edit/delete
- The UI consistently feels premium and Apple-like
- The production build succeeds

