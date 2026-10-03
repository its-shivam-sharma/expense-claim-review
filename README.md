# Expense Claim Policy Review Assistant

An internal expense claim review application that combines deterministic policy validation with AI-assisted claim classification and human reviewer decisions.

## Overview

The application helps reviewers evaluate employee expense claims against company expense policies.

The system combines:

- Deterministic validation for required fields, duplicates, receipts, dates, and policy limits.
- AI-assisted expense classification and policy explanation.
- Policy evidence from stored company policies.
- Human reviewer decisions.
- Review history and audit trail.
- Automated smoke testing.

---

## Features

### Claim Management

- Create expense claims.
- View existing claims.
- View claim details.
- Track claim status.

### Deterministic Validation

The backend validates:

- Required fields.
- Positive claim amount.
- Missing receipts.
- Future dates.
- Category policy limits.
- Duplicate claims.

### AI Review

The application uses a locally running Ollama model to:

- Classify the expense.
- Provide a confidence score.
- Explain the classification.
- Provide relevant policy evidence.
- Mark uncertain classifications.

The AI is instructed to use only the policies provided by the application.

### Human Review

A reviewer can:

- Approve a claim.
- Reject a claim.
- Request clarification.
- Override the AI classification.

Reasons are required for rejection, clarification requests, and AI overrides.

### Review History

Every reviewer decision is stored and displayed as part of the claim review history.

### Dashboard

The dashboard displays:

- Total claims.
- Pending review.
- Approved claims.
- Rejected claims.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma

### Database

- PostgreSQL

### AI

- Ollama
- Llama 3.2 3B

---

## Project Structure

```text
expense-claim-review/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── lib/
│   └── scripts/
│       └── smoke-test.mjs
│
├── frontend/
│   └── app/
│       ├── page.tsx
│       ├── layout.tsx
│       └── globals.css
│
├── README.md
└── AGENT_USAGE.md