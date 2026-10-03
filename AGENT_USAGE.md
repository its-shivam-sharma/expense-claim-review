# Agent Usage

## Overview

AI coding assistants were used during development to accelerate implementation, debugging, testing, and documentation.

The final application logic was reviewed and tested locally.

## How AI Assistance Was Used

### 1. Project Planning

AI assistance was used to break the assessment requirements into smaller implementation tasks:

- Database schema
- Claim creation and listing
- Deterministic policy validation
- AI-based claim review
- Reviewer decisions
- Review history
- Frontend dashboard
- Automated smoke testing
- Documentation

### 2. Backend Development

AI assistance helped with implementation ideas and debugging for:

- Express.js API routes
- Prisma database integration
- Claim validation
- Policy lookup
- Reviewer decision workflow
- Review history
- Error handling

All backend functionality was tested locally.

### 3. AI Review Workflow

The application uses a locally running Ollama model for claim review.

The AI receives:

- Claim details
- Available policy information
- Review instructions

The AI returns structured JSON containing:

- Classified category
- Confidence
- Uncertainty flag
- Explanation
- Policy evidence
- Clarification requirement
- Clarification questions

The backend stores the AI review result with the claim.

### 4. Deterministic Validation

Business-critical validation is handled by backend code rather than relying only on the AI model.

Examples include:

- Required fields
- Positive claim amount
- Missing receipt
- Future claim date
- Category spending limits
- Duplicate claims

### 5. Frontend Development

AI assistance was used for UI implementation and debugging.

The frontend provides:

- Claim creation
- Claim listing
- Claim details
- Deterministic validation results
- AI review results
- Reviewer actions
- Review history
- Dashboard summary cards
- Loading and error states

### 6. Testing

An automated backend smoke-test script was created to verify the main workflow.

The smoke tests cover:

- Claim creation
- Claim listing
- Deterministic validation
- Missing receipt validation
- Policy limit validation
- Duplicate detection
- AI review
- Reviewer approval
- Reviewer rejection
- Clarification requests
- AI classification override
- Review history
- Reviewer reason validation

The complete smoke test suite passed successfully during local testing.

## Human Review

AI-generated code and suggestions were reviewed and adapted during implementation.

The final implementation was manually tested through the application and backend API workflow.

AI is used as an assistant in the product itself, but final claim decisions remain under human reviewer control.

## Development Principle

AI assistance was used to speed up development, but deterministic business rules and human review remain responsible for important claim decisions.