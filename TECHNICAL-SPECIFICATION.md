# Technical Specification: ggthaka

| **Document Version** | 1.0          |
| -------------------- | ------------ |
| **Date**             | 2026-03-01   |
| **Author(s)**        | Project Lead |
| **Status**           | Proposed     |

---

## Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
  - [1.4 References](#14-references)
  - [1.5 Overview](#15-overview)
- [2. Overall Description](#2-overall-description)
  - [2.1 Product Perspective](#21-product-perspective)
  - [2.2 Product Functions](#22-product-functions)
  - [2.3 User Characteristics](#23-user-characteristics)
  - [2.4 Assumptions and Dependencies](#24-assumptions-and-dependencies)
- [3. System Architecture and Design](#3-system-architecture-and-design)
  - [3.1 Architectural Overview](#31-architectural-overview)
  - [3.2 Technology Stack](#32-technology-stack)
  - [3.3 System Context Diagram](#33-system-context-diagram)
  - [3.4 Component Diagram](#34-component-diagram)
  - [3.5 Data Flow Diagrams](#35-data-flow-diagrams)
- [4. Detailed Requirements](#4-detailed-requirements)
  - [4.1 Functional Requirements](#41-functional-requirements)
  - [4.2 Non-Functional Requirements](#42-non-functional-requirements)
  - [4.3 External Interface Requirements](#43-external-interface-requirements)
- [5. Data Design](#5-data-design)
  - [5.1 Data Model](#51-data-model)
  - [5.2 Data Storage](#52-data-storage)
  - [5.3 Data Flow and Processing](#53-data-flow-and-processing)
- [6. User Interface Design](#6-user-interface-design)
  - [6.1 UI/UX Guidelines](#61-uiux-guidelines)
  - [6.2 Wireframes / Mockups](#62-wireframes--mockups)
  - [6.3 Navigation Flow](#63-navigation-flow)
- [7. Security Considerations](#7-security-considerations)
  - [7.1 Authentication and Authorization](#71-authentication-and-authorization)
  - [7.2 Data Protection](#72-data-protection)
  - [7.3 Compliance](#73-compliance)
- [8. Performance and Scalability](#8-performance-and-scalability)
  - [8.1 Performance Targets](#81-performance-targets)
  - [8.2 Scalability Strategy](#82-scalability-strategy)
- [9. Deployment and Operations](#9-deployment-and-operations)
  - [9.1 Deployment Environment](#91-deployment-environment)
  - [9.2 CI/CD Pipeline](#92-cicd-pipeline)
  - [9.3 Monitoring and Logging](#93-monitoring-and-logging)
  - [9.4 Backup and Disaster Recovery](#94-backup-and-disaster-recovery)
- [10. Testing Strategy](#10-testing-strategy)
  - [10.1 Testing Levels](#101-testing-levels)
  - [10.2 Test Environment and Data](#102-test-environment-and-data)
  - [10.3 Quality Metrics](#103-quality-metrics)
- [11. Project Milestones and Timeline](#11-project-milestones-and-timeline)
- [12. Open Issues / Risks](#12-open-issues--risks)
- [13. Appendices](#13-appendices)
  - [Appendix A – Directory Structure](#appendix-a--directory-structure)
  - [Appendix B – Environment Variables](#appendix-b--environment-variables)
  - [Appendix C – API Route Specification](#appendix-c--api-route-specification)
  - [Appendix D – AGENTS.md Mapping](#appendix-d--agentsmd-mapping)

---

## 1. Introduction

### 1.1 Purpose

This Technical Specification documents the architectural and implementation details for **ggthaka**, a personal website designed to showcase software engineering work and publish technical content. It serves as the definitive technical reference for developers, stakeholders, and contributors, detailing system components, technology choices, data design, and operational requirements. The specification is written to align with the governance rules defined in `AGENTS.md` and the strategic goals outlined in the Concept Note.

### 1.2 Scope

This specification covers the complete technical implementation of the ggthaka website, including:

**In scope:**

- Next.js application architecture following the layered structure mandated in `AGENTS.md`.
- Content management using Markdown files stored in a dedicated `content/` directory.
- Static site generation with Incremental Static Regeneration (ISR).
- Client‑side components organised under the five‑category taxonomy.
- Server‑side logic structured into handlers, policies, and utilities.
- Export‑barrel system for clean import aliases.
- CSS Modules with PascalCase naming.
- Deployment pipeline and infrastructure configuration.
- Testing and quality assurance processes.

**Out of scope:**

- Development of the future LMS platform.
- Third‑party comment systems or social media integrations.
- Video content delivery infrastructure.
- Mobile application development.
- Multi‑language internationalisation.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term   | Definition                                                                 |
| ------ | -------------------------------------------------------------------------- |
| CMS    | Content Management System                                                  |
| SSG    | Static Site Generator                                                      |
| ISR    | Incremental Static Regeneration                                            |
| MDX    | Markdown with JSX components                                               |
| FCP    | First Contentful Paint                                                     |
| LCP    | Largest Contentful Paint                                                   |
| CLS    | Cumulative Layout Shift                                                    |
| TTFB   | Time to First Byte                                                         |
| CI/CD  | Continuous Integration / Continuous Deployment                             |
| RPO    | Recovery Point Objective                                                   |
| RTO    | Recovery Time Objective                                                    |
| ADR    | Architecture Decision Record                                               |
| `pg`   | Node‑postgres client library for direct PostgreSQL access                  |
| Barrel | An index/re‑export file in `src/exports/*` providing a single import point |

### 1.4 References

| Reference                  | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| Concept Note: ggthaka v1.0 | Project concept, goals, and market positioning (2026‑03‑01)       |
| `AGENTS.md` v2.0.0         | Agent execution specification – governance and architecture rules |
| Next.js Documentation      | Framework documentation and best practices                        |
| Core Web Vitals            | Google's performance metrics documentation                        |
| Vercel Documentation       | Deployment and hosting platform documentation                     |
| WCAG 2.1                   | Web Content Accessibility Guidelines                              |

### 1.5 Overview

This document is organised into thirteen sections. Following this introduction, Section 2 provides an overall product description. Section 3 details the system architecture and technology stack, incorporating the layered design from `AGENTS.md`. Sections 4 through 6 cover detailed requirements, data design, and user interface specifications. Sections 7 through 10 address security, performance, deployment, and testing. Sections 11 through 13 cover project planning, risks, and appendices.

---

## 2. Overall Description

### 2.1 Product Perspective

**ggthaka** is a new, standalone personal website built from scratch. It does not replace any existing system but consolidates the creator's professional presence into a single, cohesive platform. The site serves two primary business functions: client acquisition through project showcases and transparent pricing, and audience building through technical blog content.

The system fits into a larger strategic roadmap that includes a future Learning Management System (LMS). The website will act as the initial audience‑building channel and credibility foundation for that later product. The architecture follows the strict conventions defined in `AGENTS.md` to ensure maintainability, consistency, and alignment with the project’s long‑term engineering philosophy.

### 2.2 Product Functions

- **Project case study display**: Detailed project pages presenting problems, solutions, and outcomes with technical diagrams and clear calls‑to‑action.
- **Transparent pricing information**: A dedicated page outlining service types and investment levels to pre‑qualify client inquiries.
- **Technical blog publishing**: Long‑form article pages with support for code blocks, diagrams, and rich formatting.
- **About and contact functionality**: Professional biography and a simple contact form for inquiries.
- **Open‑source codebase**: Public GitHub repository with documentation for other developers to learn from and contribute.
- **Performance‑optimised delivery**: Fast page loads through static generation, image optimisation, and CDN distribution.

### 2.3 User Characteristics

| User Group                                       | Technical Level | Key Needs                                                                                                       |
| ------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------- |
| Prospective Clients (CTOs, Founders, Tech Leads) | High to Medium  | Quick skill assessment, understanding of past work complexity, transparent cost expectations, easy contact path |
| Future Students (Senior Engineers)               | High            | Deep technical content, credibility assessment, practical insights, authoritative teaching voice                |
| Open‑Source Contributors                         | High            | Well‑documented codebase, clear contribution guidelines, learning opportunities from implementation             |
| General Technical Readers                        | Medium to High  | Accessible technical articles, clean reading experience, shareable content                                      |

### 2.4 Assumptions and Dependencies

**Assumptions:**

- Target audiences value depth over breadth in technical content.
- Transparent pricing will attract qualified leads rather than deter all potential clients.
- The creator can maintain a consistent content publishing cadence.
- Open‑sourcing the site will not create unsustainable maintenance overhead.

**Dependencies:**

- **Next.js** and React ecosystem remain stable and maintained.
- **Vercel** provides reliable hosting with sufficient free‑tier resources for initial traffic.
- **Node.js** environment for development and build processes.
- **GitHub** for version control and open‑source collaboration.
- No significant changes to web standards that would require major refactoring.

---

## 3. System Architecture and Design

### 3.1 Architectural Overview

The ggthaka website employs a **Jamstack architecture** with Next.js as the core framework. The site is primarily statically generated at build time, with Incremental Static Regeneration (ISR) for content updates. This approach delivers exceptional performance, security, and scalability while maintaining a simple development workflow.

The architecture strictly follows the layered structure mandated in `AGENTS.md`:

- **UI Layer (`src/components/`)**: Components organised into five required categories: `layout/`, `page/`, `section/`, `shared/`, `provider/`.
- **Domain / Library Layer (`src/library/`)**: Business logic split into `handlers/`, `policies/`, `utilities/`, `hooks/`, `contexts/`, and `json/`.
- **Data Layer (`src/library/database/` + `database/`)**: PostgreSQL database accessed directly via the `pg` driver. Schema defined in `database/schema.sql`; connection pool instantiated in `src/library/database/client.ts`.
- **Export Layer (`src/exports/`)**: Centralised re‑exports for all reusable modules, enabling clean alias imports.
- **Styling Layer (`src/styles/`)**: CSS Modules mirroring the component category structure, with Pascal‑case class names.
- **Routing Layer (`src/app/`)**: Next.js App Router for pages and API routes. API routes are kept thin, delegating to policies and handlers.

The architecture guarantees:

- UI never talks directly to the database or file system.
- Route handlers orchestrate only, enforcing policies before calling handlers.
- Policies own validation and guard logic.
- Handlers own business and persistence logic, including database access via the `pg` connection pool.
- Only handlers may import and use the database client; no direct database access from routes, policies, or UI components.
- All reusable modules are exported via barrels and imported using TypeScript path aliases (e.g., `@components/section`, `@library/handlers`, `@library/database`, `@styles/section`).

### 3.2 Technology Stack

| Component                | Technology / Framework              | Version | Justification                                                                     |
| ------------------------ | ----------------------------------- | ------- | --------------------------------------------------------------------------------- |
| **Frontend Framework**   | Next.js                             | 14.x    | React‑based with hybrid rendering, excellent performance, built‑in optimisations  |
| **Programming Language** | TypeScript                          | 5.x     | Type safety, better developer experience, self‑documenting code                   |
| **Styling**              | CSS Modules                         | -       | Scoped styles, no runtime overhead, aligns with project conventions               |
| **Content Format**       | MDX                                 | Latest  | Markdown with component support for rich interactive elements                     |
| **Content Processing**   | `next-mdx-remote`                   | Latest  | Serialise MDX content at build time                                               |
| **Code Highlighting**    | `rehype-pretty-code`                | Latest  | Syntax highlighting for code blocks                                               |
| **Diagram Support**      | Mermaid.js                          | Latest  | Technical diagrams in Markdown                                                    |
| **Contact Form**         | Next.js API Routes                  | 14.x    | Serverless functions, no separate backend                                         |
| **Email Delivery**       | Resend (or Nodemailer)              | Latest  | Reliable email API for contact form submissions                                   |
| **Version Control**      | Git / GitHub                        | -       | Open‑source collaboration, CI/CD integration                                      |
| **Hosting & CDN**        | Vercel                              | -       | Optimised for Next.js, global CDN, preview deployments                            |
| **Package Manager**      | pnpm                                | 8.x     | Fast, disk‑efficient, strict dependency management                                |
| **Database**             | PostgreSQL                          | 16.x    | Robust relational database; structured data storage for posts, projects, contacts |
| **Database Driver**      | `pg` (node‑postgres)                | 8.x     | Direct PostgreSQL access via connection pool; no ORM abstraction layer            |
| **Analytics**            | Vercel Analytics / Simple Analytics | -       | Privacy‑focused, performance metrics                                              |
| **Alias Configuration**  | TypeScript `paths` + `exports/`     | -       | Enforces barrel‑based imports and prevents deep relative paths                    |

### 3.3 System Context Diagram

The system context diagram shows the external entities and their interactions with the ggthaka website:

- **Website Visitors**
  - Send HTTP requests to the ggthaka website.
  - Receive HTML, CSS, and JavaScript responses.
  - Submit contact form data to the API endpoint.

- **Developer (Creator)**
  - Writes content and code.
  - Pushes changes to GitHub repository.
  - Triggers builds and deployments.

- **GitHub Repository**
  - Stores source code and content.
  - Integrates with Vercel for CI/CD.
  - Triggers preview and production deployments.

- **Vercel Build System**
  - Receives webhook from GitHub on push.
  - Runs build process (type check, lint, test, build).
  - Deploys to Vercel edge network.
  - Provides preview URLs for pull requests.

- **Email Service (Resend)**
  - Receives contact form submissions from the API route.
  - Delivers emails to the creator's inbox.
  - Returns delivery status to the API.

- **ggthaka Website (Next.js on Vercel)**
  - Serves static pages and assets.
  - Handles API requests via serverless functions.
  - Interacts with email service for contact form.
  - Receives deployments from Vercel.

### 3.4 Component Diagram

The component diagram illustrates the internal structure of the Next.js application:

- **Next.js Application**
  - **Pages Layer (`src/app/`)**
    - Home page (`/`)
    - Work listing (`/work`)
    - Work detail (`/work/[slug]`)
    - Blog index (`/blog`)
    - Blog post (`/blog/[slug]`)
    - Pricing page (`/pricing`)
    - About page (`/about`)
    - API route (`/api/contact`)
  - **Components Layer (`src/components/`)**
    - **layout/** – structural components (Header, Footer)
    - **page/** – page‑level composition components (HomePage, WorkPage, BlogPage)
    - **section/** – domain sections (Hero, FeaturedWork, RecentPosts, CaseStudy, PostContent)
    - **shared/** – reusable UI elements (Button, Card, CodeBlock, Diagram)
    - **provider/** – context providers (ThemeProvider)
  - **Library Layer (`src/library/`)**
    - **handlers/** – business operations (content retrieval, contact processing, database queries)
    - **policies/** – validation rules (emailPolicy, messagePolicy, originPolicy)
    - **utilities/** – helper functions (sendEmail, rateLimiter, formatDate)
    - **hooks/** – client‑side logic (useBlogPost, useContactForm)
    - **contexts/** – React contexts (ThemeContext)
    - **json/** – static configuration (siteConfig.json)
    - **database/** – PostgreSQL connection pool and query utilities
      - `client.ts` – singleton `pg.Pool` instance
      - `seed.ts` – database seeding script
  - **Data Layer (`database/`)**
    - `schema.sql` – database schema definition
    - `migrations/` – versioned raw SQL migration files
  - **Exports Layer (`src/exports/`)**
    - components.ts – re‑exports all components
    - library.ts – re‑exports all library modules
    - database.ts – re‑exports database client pool
    - styles.ts – re‑exports CSS Modules
  - **Styles Layer (`src/styles/`)**
    - **layout/** – CSS Modules for layout components
    - **page/** – CSS Modules for page components
    - **section/** – CSS Modules for section components
    - **shared/** – CSS Modules for shared components
    - **provider/** – CSS Modules for providers

### 3.5 Data Flow Diagrams

**Content Request Flow (Build Time):**

1. Developer writes MDX files in `/content/blog/` and `/content/work/`.
2. Developer commits changes to GitHub (main branch).
3. GitHub triggers Vercel build.
4. Vercel runs the Next.js build process:
   - Database migrations are applied (raw SQL migration scripts from `database/migrations/`).
   - A sync step reads MDX files, extracts frontmatter, and upserts metadata into the PostgreSQL `posts` and `case_studies` tables.
   - Handlers in `src/library/handlers/` query PostgreSQL via the `pg` connection pool for structured data (listings, tags, sort order) and read the file system for raw MDX body content.
   - Content is processed with remark/rehype plugins.
   - Pages are generated statically (HTML) using `getStaticProps`.
   - Assets are optimised and hashed.
5. Built files are deployed to Vercel CDN.

**Contact Form Flow (Runtime):**

1. Visitor fills out the contact form (UI component in `src/components/section/ContactForm.tsx`).
2. The form uses a custom hook `useContactForm` from `src/library/hooks/useContactForm.ts`.
3. The hook sends a POST request to `/api/contact`.
4. API route handler (`src/app/api/contact/route.ts`) executes:
   - Enforces origin policy.
   - Enforces JSON content type.
   - Validates fields using policies (`emailPolicy`, `messagePolicy`).
   - If validation fails, returns `API.Failure` with 400 status.
   - If validation passes, calls handler `createContactSubmission` which persists the submission to the `contact_submissions` table via the `pg` pool.
   - Calls utility `sendEmail` (from `src/library/utilities/sendEmail.ts`) to forward via Resend API.
   - Returns `API.Success` with 200 status.
5. Hook receives response and updates UI (success/error message).

**Blog Post Request Flow (Runtime with ISR):**

1. Visitor requests `/blog/[slug]`.
2. Request hits CDN edge.
3. CDN checks for cached HTML:
   - If cached and fresh, serves immediately.
   - If cached but stale, serves stale version and triggers background regeneration.
   - If not cached, forwards to origin server (Vercel).
4. Origin server:
   - Calls handler `getBlogPost` from `src/library/handlers/content.ts` which queries PostgreSQL for post metadata and reads the MDX file for body content.
   - If post exists and is published, renders page.
   - If post does not exist, returns 404.
   - Rendered page is sent to visitor and cached at CDN with appropriate TTL.

---

## 4. Detailed Requirements

### 4.1 Functional Requirements

| ID    | Module            | Description                                           | Acceptance Criteria                                                                                      |
| ----- | ----------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| FR‑01 | Navigation        | Site provides consistent navigation across all pages. | Header with links to Home, Work, Blog, Pricing, About; mobile‑responsive menu; current page highlighted. |
| FR‑02 | Work Listing      | Display grid of project case studies.                 | Projects show title, brief description, technologies used; click leads to detailed case study.           |
| FR‑03 | Case Study Detail | Present detailed project information.                 | Includes problem statement, solution description, technical diagrams, outcome metrics, link to pricing.  |
| FR‑04 | Blog Index        | List all published blog posts.                        | Posts show title, publication date, reading time, excerpt; pagination or infinite scroll for many posts. |
| FR‑05 | Blog Post         | Display individual article with rich content.         | MDX rendering with code syntax highlighting, diagrams, headings, images; estimated reading time.         |
| FR‑06 | Pricing Page      | Present service offerings with investment levels.     | Clear pricing tiers or ranges; service descriptions; call‑to‑action to contact.                          |
| FR‑07 | About Page        | Professional biography and background.                | Photo, professional summary, skills, experience highlights, personal touch.                              |
| FR‑08 | Contact Form      | Allow visitors to send inquiries.                     | Name, email, message fields; validation; spam protection; success/failure feedback.                      |
| FR‑09 | Form Submission   | Deliver contact messages to creator.                  | Form data sent via email; confirmation to visitor; rate limiting to prevent abuse.                       |
| FR‑10 | 404 Page          | Custom not‑found page.                                | Maintains site branding; provides navigation options back to main content.                               |
| FR‑11 | RSS Feed          | Provide blog RSS feed for subscribers.                | Automatically generated feed of recent posts; discoverable via link tags.                                |
| FR‑12 | Sitemap           | Generate XML sitemap for search engines.              | Auto‑generated on build; includes all public pages and blog posts.                                       |

### 4.2 Non‑Functional Requirements

| ID     | Category        | Description                             | Target / Metric                                                                                 |
| ------ | --------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| NFR‑01 | Performance     | Fast page loads for all visitors.       | LCP < 2.5s, FCP < 1.8s, TTFB < 0.6s                                                             |
| NFR‑02 | Performance     | Smooth visual stability.                | CLS < 0.1                                                                                       |
| NFR‑03 | Performance     | Fast interaction response.              | FID < 100ms                                                                                     |
| NFR‑04 | Accessibility   | Usable by people with disabilities.     | WCAG 2.1 AA compliance                                                                          |
| NFR‑05 | Responsiveness  | Optimal viewing on all devices.         | Perfect layout on mobile, tablet, desktop viewports                                             |
| NFR‑06 | Availability    | Site remains accessible.                | 99.9% uptime (aligned with Vercel SLA)                                                          |
| NFR‑07 | Security        | Protect against common vulnerabilities. | No XSS, CSRF, injection risks; secure headers implemented                                       |
| NFR‑08 | Maintainability | Codebase easy to understand and modify. | TypeScript coverage >90%; documented components; consistent patterns per `AGENTS.md`            |
| NFR‑09 | SEO             | Search engine discoverability.          | Meta tags, structured data, semantic HTML, sitemap                                              |
| NFR‑10 | Privacy         | User data protection.                   | No analytics cookies without consent; minimal data collection                                   |
| NFR‑11 | Build Time      | Fast production builds.                 | Full build < 3 minutes                                                                          |
| NFR‑12 | Scalability     | Handle traffic spikes.                  | Automatic scaling via Vercel; CDN caching reduces origin load                                   |
| NFR‑13 | Architecture    | Adherence to `AGENTS.md` conventions.   | All code placed in correct layers; imports via aliases; barrels updated; CSS Modules PascalCase |

### 4.3 External Interface Requirements

**User Interfaces:**

- Web browser interface supporting latest versions of Chrome, Firefox, Safari, Edge.
- Responsive design for screen widths from 320px to 4K.
- Print‑friendly styling for blog posts.

**Software Interfaces:**

- **GitHub API**: For CI/CD triggers and repository management.
- **Email Service API**: Resend or similar for contact form delivery.
- **Vercel API**: For deployment status and preview comments (optional).

**Communication Protocols:**

- HTTPS for all web traffic (TLS 1.2+).
- REST over HTTPS for contact form API.
- SMTP for email delivery (via email service provider).

---

## 5. Data Design

### 5.1 Data Model

The site uses a **hybrid data model**. Content is authored as Markdown (MDX) files in a top‑level `/content` directory and metadata is synchronised to a PostgreSQL database at build time. The database serves as the source of truth for querying (listings, filtering, search), while MDX files remain the source of truth for authoring and body content.

**Relational Schema (PostgreSQL):**

```
posts
│── id            UUID        PK, default gen_random_uuid()
│── slug          VARCHAR     UNIQUE, NOT NULL
│── title         VARCHAR     NOT NULL
│── excerpt       TEXT
│── published     BOOLEAN     DEFAULT false
│── featured      BOOLEAN     DEFAULT false
│── cover_image   VARCHAR
│── reading_time  INTEGER
│── published_at  TIMESTAMPTZ
│── modified_at   TIMESTAMPTZ
│── created_at    TIMESTAMPTZ DEFAULT now()
│── updated_at    TIMESTAMPTZ DEFAULT now()

tags
│── id            UUID        PK, default gen_random_uuid()
│── name          VARCHAR     UNIQUE, NOT NULL
│── slug          VARCHAR     UNIQUE, NOT NULL

post_tags (join table)
│── post_id       UUID        FK → posts.id ON DELETE CASCADE
│── tag_id        UUID        FK → tags.id  ON DELETE CASCADE
│── PK (post_id, tag_id)

case_studies
│── id            UUID        PK, default gen_random_uuid()
│── slug          VARCHAR     UNIQUE, NOT NULL
│── title         VARCHAR     NOT NULL
│── client        VARCHAR
│── summary       TEXT
│── technologies  TEXT[]      (PostgreSQL array)
│── role          VARCHAR
│── duration      VARCHAR
│── outcome       TEXT
│── featured      BOOLEAN     DEFAULT false
│── image         VARCHAR
│── published_at  TIMESTAMPTZ
│── created_at    TIMESTAMPTZ DEFAULT now()
│── updated_at    TIMESTAMPTZ DEFAULT now()

contact_submissions
│── id            UUID        PK, default gen_random_uuid()
│── name          VARCHAR     NOT NULL
│── email         VARCHAR     NOT NULL
│── message       TEXT        NOT NULL
│── ip_address    VARCHAR
│── status        VARCHAR     DEFAULT 'new' (new | read | replied | archived)
│── created_at    TIMESTAMPTZ DEFAULT now()
```

**Blog Post MDX Frontmatter (authoring source):**

```yaml
---
slug: getting-started-with-system-design
title: Getting Started with System Design
date: 2026-05-03
modified: 2026-05-03
excerpt: A practical introduction to system design concepts for senior engineers.
tags: [system-design, architecture]
published: true
featured: false
coverImage: /images/system-design-cover.jpg
---
# Content in MDX...
```

**Case Study MDX Frontmatter (authoring source):**

```yaml
---
slug: fintech-dashboard
title: FinTech Analytics Dashboard
client: Confidential FinTech Startup
date: 2026-02-15
summary: Built a real‑time analytics dashboard handling 1M+ events/day.
technologies: [Next.js, PostgreSQL, Redis, AWS]
role: Lead Developer
duration: 3 months
outcome: 40% reduction in report generation time.
featured: true
image: /images/fintech-dashboard.png
---
# Detailed case study content...
```

**Site Configuration (stored in `src/library/json/siteConfig.json`):**

```json
{
  "title": "ggthaka",
  "description": "Software engineering portfolio and blog",
  "author": "Your Name",
  "email": "hello@ggthaka.com",
  "siteUrl": "https://ggthaka.com",
  "social": {
    "github": "https://github.com/ggthaka",
    "linkedin": "https://linkedin.com/in/ggthaka",
    "twitter": "https://twitter.com/ggthaka"
  }
}
```

### 5.2 Data Storage

| Data Type           | Storage Location                 | Format          | Access Method                              |
| ------------------- | -------------------------------- | --------------- | ------------------------------------------ |
| Blog post metadata  | PostgreSQL `posts` table         | Relational rows | SQL queries via handler                    |
| Blog post body      | `/content/blog/`                 | `.mdx` files    | File system read via handler               |
| Case study metadata | PostgreSQL `case_studies`        | Relational rows | SQL queries via handler                    |
| Case study body     | `/content/work/`                 | `.mdx` files    | File system read via handler               |
| Tags                | PostgreSQL `tags`, `post_tags`   | Relational rows | SQL queries via handler                    |
| Contact submissions | PostgreSQL `contact_submissions` | Relational rows | Persisted via handler; forwarded via email |
| Site config         | `src/library/json/`              | `.json` / `.ts` | Direct import via alias                    |
| Static assets       | `/public/`                       | Images, fonts   | Direct URL access                          |

**File Organisation:**

```
/content
  /blog
    - getting-started-with-system-design.mdx
    - debugging-production-incidents.mdx
    /images
      - diagram-1.png
      - screenshot-1.jpg
  /work
    - fintech-dashboard.mdx
    - ecommerce-migration.mdx
    /images
      - architecture-diagram.png
      - performance-chart.jpg
/database
  - schema.sql
  /migrations
    - 001_initial.sql
    - 002_add_contact_submissions.sql
/public
  /images
    - profile.jpg
    - og-image-default.jpg
  /fonts
    - inter-var.woff2
  favicon.ico
```

### 5.3 Data Flow and Processing

**Build‑Time Data Flow:**

1. **Database migrations** are applied (raw SQL scripts from `database/migrations/`) to ensure the database schema is up to date.
2. A **sync script** (`src/library/database/seed.ts`) reads all MDX files, extracts frontmatter, and upserts metadata into the PostgreSQL `posts` and `case_studies` tables. Tags are normalised into the `tags` and `post_tags` tables.
3. **Handlers** (`src/library/handlers/content.ts`) query PostgreSQL via the `pg` connection pool for structured listings (published posts sorted by date, featured projects, tag filtering).
4. MDX body content is read from the file system and passed through remark/rehype plugins for syntax highlighting, Mermaid diagram rendering, and image optimisation.
5. **Pages** (`src/app/...`) call handlers via `getStaticProps` to fetch data.
6. Static pages are generated for each content item.
7. Index pages aggregate content with sorting and filtering from database queries.
8. RSS feed and sitemap are generated using utilities.
9. All assets are optimised and hashed for caching.

**Request‑Time Data Flow:**

- **Static pages**: Served directly from CDN edge.
- **ISR pages**: Checked for staleness; regenerated in background if needed. During regeneration, handlers query PostgreSQL for fresh metadata.
- **API routes**: Serverless function validates input using policies, calls handler to persist data to PostgreSQL via the `pg` pool, calls utility to send email, returns response.
- **Database connections**: Managed via `pg.Pool` with configurable pool size, idle timeout, and SSL settings.

---

## 6. User Interface Design

### 6.1 UI/UX Guidelines

**Design Principles:**

- **Minimal and focused**: Content‑first design with minimal distractions.
- **Fast and responsive**: Performance as a feature, immediate feedback.
- **Readable typography**: Comfortable reading experience for long‑form content.
- **Consistent spacing**: Predictable visual rhythm.
- **Accessible by default**: High contrast, keyboard navigation, semantic HTML.

**Visual Style:**

- **Typography**: System fonts (Inter or similar) for optimal performance.
- **Colour palette**: Monochromatic base with one accent colour for interactions.
- **Spacing**: 4px grid system; consistent padding and margins.
- **Dark mode**: Support for system preference (future enhancement).

**Accessibility Standards:**

- Semantic HTML5 elements.
- Proper heading hierarchy (h1‑h6).
- Alt text for all images.
- ARIA labels where necessary.
- Focus indicators for keyboard navigation.
- Minimum colour contrast ratios (4.5:1 for normal text).

### 6.2 Wireframes / Mockups

**Homepage Layout (Section Components):**

```
┌─────────────────────────────────────┐
│  Header (layout/Header)             │
├─────────────────────────────────────┤
│  Hero (section/Hero)                 │
│  ┌───────────────────────────────┐  │
│  │  Introduction + Tagline        │  │
│  └───────────────────────────────┘  │
│                                     │
│  Featured Work (section/FeaturedWork)│
│  ┌──────────┐ ┌──────────┐         │
│  │ Project  │ │ Project  │         │
│  │ Card     │ │ Card     │         │
│  │ (shared/ │ │ (shared/ │         │
│  │  Card)   │ │  Card)   │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  Recent Blog Posts (section/RecentPosts)│
│  ┌───────────────────────────────┐  │
│  │ Post 1: Title + Excerpt       │  │
│  ├───────────────────────────────┤  │
│  │ Post 2: Title + Excerpt       │  │
│  ├───────────────────────────────┤  │
│  │ Post 3: Title + Excerpt       │  │
│  └───────────────────────────────┘  │
│                                     │
│  Call to Action (section/CTA)       │
├─────────────────────────────────────┤
│  Footer (layout/Footer)             │
└─────────────────────────────────────┘
```

**Blog Post Layout:**

```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│  Post Header (section/PostHeader)    │
│  ┌───────────────────────────────┐  │
│  │  Post Title                   │  │
│  │  Date · Reading Time · Tags   │  │
│  └───────────────────────────────┘  │
│                                     │
│  Post Content (section/PostContent) │
│  ┌───────────────────────────────┐  │
│  │  MDX rendered with:           │  │
│  │  - CodeBlock (shared/)        │  │
│  │  - Diagram (shared/)          │  │
│  └───────────────────────────────┘  │
│                                     │
│  Author Bio (section/AuthorBio)     │
│  Share Links (shared/ShareButtons)  │
│                                     │
│  Related Posts (section/RelatedPosts)│
├─────────────────────────────────────┤
│  Footer                             │
└─────────────────────────────────────┘
```

### 6.3 Navigation Flow

```
- Home
  - Work
    - Case Study (dynamic)
  - Blog
    - Blog Post (dynamic)
  - Pricing
  - About
    - Contact (via link from About)
- Contact (accessible from navigation or CTA)
```

The navigation is consistent across all pages, with the current page highlighted. Mobile navigation collapses into a hamburger menu.

---

## 7. Security Considerations

### 7.1 Authentication and Authorization

The website does not require user authentication. The only protected operation is the contact form submission, secured through:

- **Rate limiting**: Prevent abuse by limiting submissions per IP address (implemented in API route).
- **Input validation**: Server‑side validation via policies (`emailPolicy`, `messagePolicy`).
- **CORS/origin policy**: Enforced at the API route level to restrict requests to allowed origins.

No administrative interface is exposed; content updates occur through Git commits, protected by GitHub's authentication.

### 7.2 Data Protection

**In Transit:**

- HTTPS enforced for all connections (TLS 1.2+).
- HSTS headers to prevent protocol downgrades.
- Secure ciphers only.

**At Rest:**

- No sensitive data stored in the application codebase.
- Contact form submissions persisted in PostgreSQL with minimal PII (name, email, message).
- Database credentials stored as environment variables in Vercel (encrypted) and never committed.
- PostgreSQL connections encrypted via SSL/TLS (`ssl: { rejectUnauthorized: true }` in `pg.Pool` config).
- Database provider should support encryption at rest (provider‑dependent).
- Environment variables for API keys stored in Vercel (encrypted) and never committed.

**Security Headers:**
Configured via `next.config.js` following `AGENTS.md` recommendations.

**Database Security:**

- Connection strings use SSL mode (`sslmode=require`).
- `pg.Pool` configured with a bounded connection pool to limit open connections.
- Database access restricted to handlers only (enforced by architecture).
- All queries use parameterised placeholders (`$1`, `$2`, …) to prevent SQL injection.

### 7.3 Compliance

**GDPR Considerations:**

- Minimal analytics (privacy‑focused, no cookies).
- No personal data stored.
- Contact form clearly states how data will be used.
- Privacy policy page included.

**Data Retention:**

- Contact form submissions not retained.
- Email communications stored in creator's email account (standard retention).

---

## 8. Performance and Scalability

### 8.1 Performance Targets

| Metric                       | Target      | Measurement Tool       |
| ---------------------------- | ----------- | ---------------------- |
| Largest Contentful Paint     | < 2.5s      | Lighthouse, Web Vitals |
| First Contentful Paint       | < 1.8s      | Lighthouse             |
| Cumulative Layout Shift      | < 0.1       | Lighthouse             |
| First Input Delay            | < 100ms     | Field data             |
| Time to First Byte           | < 600ms     | Lighthouse             |
| Build Time                   | < 3 minutes | CI logs                |
| Lighthouse Performance Score | > 95        | Lighthouse             |

**Expected Load:**

- Initial traffic: < 500 visitors/day.
- Peak traffic (post‑launch/viral): Up to 10,000 visitors/day.
- Concurrent users: < 100 typical.

### 8.2 Scalability Strategy

**Static Generation:**

- Most pages pre‑rendered at build time.
- Reduces origin server load to near zero.
- CDN caches content globally.

**Incremental Static Regeneration:**

- Blog posts can be updated without full rebuild.
- Stale‑while‑revalidate pattern ensures availability.

**CDN Caching:**

- All static assets cached at edge.
- HTML pages cached with appropriate TTL.
- Cache invalidation on deploy.

**Automatic Scaling:**

- Vercel automatically scales serverless functions.
- No manual infrastructure management.
- Pay‑per‑use pricing matches traffic patterns.

**Database Scaling:**

- **Connection Pooling**: `pg.Pool` is configured with bounded pool size to handle serverless function concurrency without exhausting database connections.
- **External Pooler** (optional): A connection pooler such as PgBouncer can be placed in front of PostgreSQL for high‑concurrency workloads.
- **Read Replicas** (future): PostgreSQL supports streaming replication for read‑heavy traffic.
- **Vertical Scaling**: Increase database instance resources (CPU, RAM) as traffic grows.

**Future‑Proofing:**

- Architecture supports adding API endpoints if needed.
- Can integrate with headless CMS later.
- Ready for LMS integration with minimal changes.

---

## 9. Deployment and Operations

### 9.1 Deployment Environment

**Production Environment:**

- **Hosting Platform**: Vercel (Global Edge Network)
- **Region**: Multiple regions (automatic by Vercel)
- **Domain**: Custom domain (e.g., ggthaka.com)
- **SSL/TLS**: Automatic via Vercel

**Preview Environment:**

- Automatic preview deployments for each PR.
- Unique URLs for testing.
- Isolated from production.

**Development Environment:**

- Local Next.js development server.
- Hot reloading for rapid iteration.
- Environment variables managed via `.env.local` (see `.env.example` for template).

### 9.2 CI/CD Pipeline

**Git Workflow:**

- Feature branches → Pull Request → `development` → `staging` → `production`
- Follows branching rules from `AGENTS.md` (§7).

**CI Steps (GitHub Actions):**

1. Checkout code
2. Install dependencies (`pnpm install`)
3. Type check (`tsc --noEmit`)
4. Lint (`pnpm lint`)
5. Unit tests (`pnpm test`)
6. Build test (`pnpm build`)
7. Vercel preview deployment (on PR)

**Deployment:**

- Merges to `development` trigger staging deploy.
- Merges to `production` trigger production deploy (via Vercel).

### 9.3 Monitoring and Logging

**Performance Monitoring:**

- **Vercel Analytics**: Core Web Vitals, page views.
- **Real User Monitoring**: Field data on performance.

**Error Tracking:**

- **Vercel Logs**: Function logs and errors.
- **Sentry** (optional): JavaScript error tracking.

**Availability Monitoring:**

- **Uptime monitoring** (third‑party service).
- **Status page**: Vercel status provides platform visibility.

**Alerting:**

- Build failure notifications (GitHub Actions).
- Performance regression alerts (via Lighthouse CI).

### 9.4 Backup and Disaster Recovery

**Code and Content:**

- **GitHub**: Primary source of truth with full history.
- **Local clones**: Developer workstations.
- **MDX files**: Backed by Git; database can be re‑seeded from MDX at any time.

**Database:**

- **Automated backups**: Scheduled `pg_dump` exports and WAL archiving for point‑in‑time recovery.
- **Recovery capability**: Restore from dump files or replay WAL to any point within the archive window.
- **Re‑seedable**: Since MDX files are the authoring source of truth, the `posts` and `case_studies` tables can be fully rebuilt from content files. Only `contact_submissions` data is unique to the database.

**Configuration:**

- Environment variables stored in Vercel (backed up by platform).
- Infrastructure as code (deployment configured in `vercel.json`).

**Recovery Procedures:**

| Scenario                    | Recovery Method                  | RPO     | RTO                |
| --------------------------- | -------------------------------- | ------- | ------------------ |
| Accidental content deletion | Revert Git commit, re‑seed DB    | < 5 min | < 15 min           |
| Database failure            | PostgreSQL replication failover  | < 1 min | < 5 min            |
| Database data loss          | Restore from `pg_dump` or WAL    | < 5 min | < 30 min           |
| Build failure               | Rollback to previous deploy      | N/A     | < 10 min           |
| Domain/DNS issue            | Update DNS records               | N/A     | < 1 hour           |
| Vercel outage               | Monitor status; platform‑managed | N/A     | Platform‑dependent |

---

## 10. Testing Strategy

### 10.1 Testing Levels

**Unit Testing:**

- **Framework**: Jest + React Testing Library
- **Scope**: Utility functions, helper methods, isolated components (especially `src/library/utilities/`, `src/library/handlers/`).
- **Database handlers**: Tested against a dedicated test PostgreSQL database (separate from production). The `pg.Pool` is mocked for pure unit tests; integration tests use a real test database.
- **Target**: >80% coverage for utilities, >60% for components.

**Integration Testing:**

- **Framework**: Jest + React Testing Library
- **Scope**: Component interactions, page rendering with mock data, API route integration, database handler integration.
- **Database integration**: Handlers are tested with a seeded test database to verify queries, upserts, and edge cases.
- **Migration testing**: SQL migration scripts are run against the test database in CI to catch migration issues before production.
- **Examples**: Blog index rendering posts from DB, case study navigation, form validation with policies, contact submission persistence.

**End‑to‑End Testing:**

- **Framework**: Playwright
- **Scope**: Critical user journeys.
- **Examples**:
  - Navigate from home to blog post.
  - Submit contact form successfully.
  - Verify responsive layouts at different viewports.

**Accessibility Testing:**

- **Tool**: axe‑core (via Testing Library or CI)
- **Standard**: WCAG 2.1 AA
- **Automation**: Integrated into E2E tests.

### 10.2 Test Environment and Data

**Test Environments:**

- **Local development**: `pnpm test` for unit/integration.
- **CI environment**: GitHub Actions runner.
- **Preview deployments**: Vercel preview URLs for manual E2E.

**Test Data:**

- Sample blog posts and case studies in `/content/test/` (ignored by production).
- **Test database**: A separate PostgreSQL instance seeded with known data before each test run using `src/library/database/seed.ts`.
- **Database reset**: Test database is reset between test suites by re‑running migration scripts and seed data to ensure isolation.
- Mock API responses for contact form.
- Edge cases: empty lists, long content, missing fields, duplicate slugs, invalid tags.

### 10.3 Quality Metrics

| Metric                     | Target                              | Measurement          |
| -------------------------- | ----------------------------------- | -------------------- |
| Unit test coverage         | >80% (utilities), >60% (components) | Jest coverage report |
| E2E critical path coverage | 100% of defined paths               | Test results         |
| Build success rate         | >99% on main branch                 | CI history           |
| Lighthouse score (CI)      | >95                                 | Lighthouse CI        |
| Accessibility violations   | 0 in automated tests                | axe‑core results     |
| TypeScript strict mode     | No `any` types                      | TypeScript compiler  |
| Lint warnings              | 0                                   | ESLint               |

---

## 11. Project Milestones and Timeline

| Milestone                    | Estimated Date | Key Deliverables                                                                                   |
| ---------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| **Environment Setup**        | 2026‑03‑08     | Next.js project initialised, GitHub repository, Vercel connected, folder structure per `AGENTS.md` |
| **Core Components**          | 2026‑03‑15     | Layout components (Header, Footer), export barrels, CSS Modules setup                              |
| **Content Infrastructure**   | 2026‑03‑22     | MDX integration, content handlers (`src/library/handlers/`), sample content                        |
| **Page Implementation**      | 2026‑03‑29     | Home, About, Pricing pages with section components                                                 |
| **Work Section**             | 2026‑04‑05     | Case study template, 1‑2 initial projects, MVP launch                                              |
| **Blog Implementation**      | 2026‑04‑19     | Blog index, post template, RSS feed, sitemap                                                       |
| **Contact Form**             | 2026‑04‑26     | API route, policies, email utility, rate limiting                                                  |
| **First Blog Post**          | 2026‑05‑03     | Published article, promotion ready                                                                 |
| **Open Source Release**      | 2026‑05‑10     | Documentation, contribution guide, license                                                         |
| **Ongoing Content & Polish** | Ongoing        | Regular blog posts, analytics review, refinements                                                  |

---

## 12. Open Issues / Risks

| Issue / Risk                           | Impact                            | Likelihood | Mitigation                                                        |
| -------------------------------------- | --------------------------------- | ---------- | ----------------------------------------------------------------- |
| **MDX performance with many posts**    | Build time increases              | Low        | Implement pagination, consider incremental builds, use ISR        |
| **Email deliverability**               | Contact forms may go to spam      | Medium     | Use reputable email service, SPF/DKIM setup, test thoroughly      |
| **Open source maintenance burden**     | Time spent on issues/PRs          | Low        | Clear contribution guidelines, limit scope, maintainer discretion |
| **Content creation consistency**       | Blog publishing stalls            | Medium     | Editorial calendar, batch writing, accountability                 |
| **Build size with many images**        | Slow builds, large bundles        | Low        | Optimise images, use Next.js Image component, lazy loading        |
| **Third‑party dependency updates**     | Breaking changes                  | Low        | Regular updates, dependabot, thorough testing                     |
| **Traffic spike costs**                | Unexpected Vercel bill            | Low        | Set budget alerts, monitor usage, caching reduces costs           |
| **SEO ranking challenges**             | Low visibility                    | Medium     | Follow SEO best practices, quality content, backlink strategy     |
| **Adherence to AGENTS.md conventions** | Architectural drift               | Medium     | Automated linting, code reviews, pre‑flight checklist             |
| **Database connection limits**         | Serverless functions exhaust pool | Medium     | `pg.Pool` max size tuning, optional PgBouncer, monitor usage      |
| **Database migration failures**        | Build blocked or data loss        | Low        | Test SQL migrations in CI, review scripts in PR, keep idempotent  |
| **MDX‑to‑DB sync drift**               | Stale metadata in queries         | Low        | Sync runs on every build; CI validates sync step; checksums       |
| **Contact data retention / GDPR**      | Compliance risk                   | Medium     | Implement data retention policy, automated purge after N days     |

---

## 13. Appendices

### Appendix A – Directory Structure

```
ggthaka/
├── AGENTS.md
├── PROGRESS.md
├── CONCEPT-NOTE.md
├── TECHNICAL-SPECIFICATION.md
├── database/
│   ├── schema.sql                      # Database schema
│   └── migrations/                    # Versioned raw SQL migration files
├── content/
│   ├── blog/
│   │   ├── *.mdx
│   │   └── images/
│   └── work/
│       ├── *.mdx
│       └── images/
├── public/
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (routes)/
│   │   │   ├── page.tsx               # Home
│   │   │   ├── work/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   └── about/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   └── contact/
│   │   │       └── route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── page/
│   │   │   ├── HomePage.tsx
│   │   │   ├── WorkPage.tsx
│   │   │   └── ...
│   │   ├── section/
│   │   │   ├── Hero.tsx
│   │   │   ├── FeaturedWork.tsx
│   │   │   ├── RecentPosts.tsx
│   │   │   ├── CaseStudy.tsx
│   │   │   └── ...
│   │   ├── shared/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   └── ...
│   │   └── provider/
│   │       └── ThemeProvider.tsx
│   ├── library/
│   │   ├── handlers/
│   │   │   ├── content.ts            # query DB + read MDX
│   │   │   └── contact.ts            # persist submissions
│   │   ├── policies/
│   │   │   ├── emailPolicy.ts
│   │   │   ├── messagePolicy.ts
│   │   │   └── originPolicy.ts
│   │   ├── utilities/
│   │   │   ├── sendEmail.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── formatDate.ts
│   │   ├── hooks/
│   │   │   ├── useBlogPost.ts
│   │   │   ├── useContactForm.ts
│   │   │   └── useCaseStudy.ts
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── database/
│   │   │   ├── client.ts             # pg.Pool singleton
│   │   │   └── seed.ts               # MDX → DB sync script
│   │   └── json/
│   │       └── siteConfig.json
│   ├── exports/
│   │   ├── components.ts
│   │   ├── library.ts
│   │   ├── database.ts
│   │   ├── styles.ts
│   │   └── ...
│   ├── styles/
│   │   ├── layout/
│   │   │   ├── Header.module.css
│   │   │   └── Footer.module.css
│   │   ├── page/
│   │   │   └── HomePage.module.css
│   │   ├── section/
│   │   │   ├── Hero.module.css
│   │   │   ├── FeaturedWork.module.css
│   │   │   └── ...
│   │   ├── shared/
│   │   │   ├── Button.module.css
│   │   │   └── Card.module.css
│   │   └── provider/
│   │       └── ThemeProvider.module.css
│   └── types/
│       └── global.d.ts               # API response shapes
├── .env.example
├── .gitignore
├── next.config.js
├── tsconfig.json
├── package.json
└── ...
```

### Appendix B – Environment Variables

```bash
# Required for contact form
EMAIL_SERVICE_API_KEY=resend_api_key_xxxxx
CONTACT_EMAIL=hello@ggthaka.com

# Required for database
DATABASE_URL=postgres://user:password@host:5432/ggthaka?sslmode=require
DIRECT_DATABASE_URL=postgres://user:password@host:5432/ggthaka?sslmode=require

# Optional
ANALYTICS_ID=xxxxx
SENTRY_DSN=xxxxx
```

### Appendix C – API Route Specification

**Endpoint:** `/api/contact`
**Method:** `POST`
**Content‑Type:** `application/json`

**Request Body:**

```json
{
  "name": "string (min 2 chars)",
  "email": "string (valid email)",
  "message": "string (min 10 chars)"
}
```

**Success Response (200):**

```json
{
  "ok": true,
  "data": {
    "message": "Message sent successfully"
  }
}
```

**Failure Responses:**

- `400` – Validation failed (returns `API.Failure` from policy).
- `429` – Rate limit exceeded.
- `500` – Server error.

**Rate Limiting:** 5 requests per hour per IP (implemented via utility).

### Appendix D – AGENTS.md Mapping

| AGENTS.md Section                   | How Addressed in This Specification                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| §0 – First‑Time Agent Context Rule  | Spec references `AGENTS.md` and requires reading it.                               |
| §2 – Project Overview               | Architecture layers defined and used throughout.                                   |
| §2.1 – UI Layer (`src/components/`) | Five‑category component taxonomy (§3.1, §6).                                       |
| §2.2 – Domain / Library Layer       | `src/library/` with handlers, policies, utilities, etc. (§3.1, §5).                |
| §2.3 – Exports Layer                | `src/exports/` barrel system and alias imports (§3.1, Appendix A).                 |
| §2.4 – Styling Layer                | `src/styles/` mirroring components, CSS Modules PascalCase (§6.1, Appendix A).     |
| §2.5 – Data Flow Pattern            | Canonical flow diagram and rules (§3.5, §3.1).                                     |
| §2.7 – Where Does My Code Go?       | Decision tree implicitly followed; explicit in §3.1.                               |
| §3 – Core Architecture Principles   | Enforced throughout (§3.1).                                                        |
| §4 – Repository Structure           | Exact structure detailed in Appendix A.                                            |
| §5 – Security & Data Handling       | Covered in §7; database security added for PostgreSQL.                             |
| §6 – Explicit Restrictions          | Respected; no stack changes, no secrets, etc.                                      |
| §7 – Git & Branching                | CI/CD pipeline follows branching rules (§9.2).                                     |
| §8 – Agent Command Protocol         | Not applicable to spec; for agents.                                                |
| §9 – Quick Start for Agents         | Build/lint/test commands referenced in §10.                                        |
| §10 – Definition of Done            | Reflected in testing and quality metrics (§10.3).                                  |
| §11 – Engineering Philosophy        | Implicit in design choices.                                                        |
| §12 – Enforcement Summary           | Spec itself enforces via structure.                                                |
| §13 – Project Conventions           | All conventions (zero‑tolerance, aliases, naming, etc.) are codified in this spec. |
| §14 – Pre‑Flight Gate               | Not applicable to spec.                                                            |
| §15 – File Change Impact Matrix     | Implicit in architecture; developers should consider.                              |
| §16 – Operational Protocols         | Dependency/env variable protocols referenced (§2.4, Appendix B).                   |

---

_This technical specification is provided under the MIT License._
