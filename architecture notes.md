# Architecture Notes

## 1. Project Overview

This project is a deterministic clinical safety decision-support system built on top of a Large Language Model (LLM).

Generic LLMs can produce unsafe medical recommendations because they rely on probabilistic reasoning rather than deterministic clinical validation.

This application introduces a rule-based safety layer that executes before the LLM generates a response.

The system validates:

- Drug-drug interactions
- Allergy conflicts
- Renal dosing constraints
- Clinical score calculations (eGFR, CHA₂DS₂-VASc)

Only after deterministic safety validation does the request proceed to the AI model.

This ensures critical clinical risks are surfaced before recommendations are generated.

---

# 2. High-Level Architecture Diagram

```text
                           ┌──────────────────────────────┐
                           │         Doctor Browser       │
                           │  React / Next.js Frontend UI │
                           │                              │
                           │ - Patient selector           │
                           │ - Medication review UI       │
                           │ - Generic AI comparison      │
                           │ - Safety-enhanced AI output  │
                           └──────────────┬───────────────┘
                                          │ HTTPS
                                          ▼
                           ┌──────────────────────────────┐
                           │            Nginx             │
                           │ Reverse Proxy / TLS / Cache  │
                           │                              │
                           │ - SSL termination            │
                           │ - Static asset caching       │
                           │ - Compression                │
                           │ - Security headers           │
                           └──────────────┬───────────────┘
                                          │
                                          ▼
                     ┌────────────────────────────────────────────┐
                     │ AWS EC2 (Application Server)               │
                     │ PM2-managed Next.js Fullstack App          │
                     │                                            │
                     │ Frontend Rendering                         │
                     │ - UI rendering                             │
                     │ - Static asset delivery                    │
                     │                                            │
                     │ Backend API Layer                          │
                     │ - /api/patients                            │
                     │ - /api/safety-check                        │
                     │ - /api/claude                              │
                     └──────────────────┬─────────────────────────┘
                                        │
                     ┌──────────────────┴─────────────────────────┐
                     │                                            │
                     ▼                                            ▼
       ┌─────────────────────────────┐           ┌─────────────────────────────┐
       │      Safety Engine Layer    │           │       LLM Integration       │
       │ Deterministic Rule Engine   │           │ Generic / Enhanced AI Calls │
       │                             │           │                             │
       │ - Drug Interaction Checker  │           │ - Generic prompt            │
       │ - Allergy Checker           │           │ - Safety constrained prompt │
       │ - Renal Dosing Checker      │           │ - Response normalization    │
       │ - Calculator Engine         │           │                             │
       │   • eGFR                    │           │                             │
       │   • CHA₂DS₂-VASc            │           │                             │
       │ - Constraint Generator      │           │                             │
       └──────────────┬──────────────┘           └──────────────┬──────────────┘
                      │                                         │
                      ▼                                         ▼
       ┌─────────────────────────────┐           ┌─────────────────────────────┐
       │         Supabase            │           │       External LLM API      │
       │      PostgreSQL Storage     │           │ Claude / OpenAI             │
       │                             │           │                             │
       │ - patients                  │           │ - Generic AI response       │
       │ - drugs                     │           │ - Safety-enhanced response  │
       │ - drug_interactions         │           │                             │
       │ - allergy_cross_reactivity  │           │                             │
       └─────────────────────────────┘           └─────────────────────────────┘
```

---

# 3. Technology Stack

## Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS

### Reasoning
Next.js was selected because it allows frontend rendering and backend API development in a single codebase, reducing operational complexity and enabling faster delivery within the assessment timeline.

---

## Backend
- Next.js API Routes
- Node.js runtime
- PM2 process manager

### Reasoning
This allows a lightweight full-stack deployment without introducing additional backend infrastructure.

PM2 provides:
- process supervision
- automatic restart
- uptime stability
- production deployment simplicity

---

## Database
- Supabase (PostgreSQL)

### Reasoning
Supabase was selected for rapid setup and PostgreSQL compatibility.

Benefits:
- managed database
- SQL querying
- relational schema support
- JSONB support for flexible clinical rule structures

---

## AI Layer
- Anthropic Claude / OpenAI GPT

### Reasoning
The LLM acts strictly as a constrained reasoning layer.

Safety-critical decisions remain deterministic and are not delegated to the AI model.

---

# 4. Database Design

## patients

### Purpose
Stores synthetic patient records for demo and testing.

Contains:
- demographics
- medications
- allergies
- conditions
- lab values
- patient summaries

### Design Decision
Clinical patient attributes vary significantly.

Using JSONB for:
- medications
- allergies
- labs
- conditions

allows flexible schema evolution without frequent migrations.

---

## drugs

### Purpose
Stores canonical medication metadata.

Contains:
- drug names
- normalized lookup names
- drug class
- renal dosing rules

### Design Decision
Renal rules differ significantly across medications.

Using JSONB enables flexible rule storage.

Example:

```json
{
  "rules": [
    {
      "maxEGR": 30,
      "action": "contraindicated"
    }
  ]
}
```

This avoids hardcoding clinical logic into application code.

---

## drug_interactions

### Purpose
Stores deterministic drug interaction rules.

Contains:
- interaction pairs
- severity
- mechanism
- clinical effect
- management guidance

### Design Decision
Normalized relational structure enables scalability.

Benefits:
- add new interaction via single INSERT
- no code changes
- extensible safety engine logic

---

## allergy_cross_reactivity

### Purpose
Stores class-based allergy safety mappings.

Examples:
- penicillin → cephalosporin
- penicillin → carbapenem
- sulfonamide → sulfonamide

### Design Decision
Supports broader allergy detection beyond exact string matching.

---

# 5. Safety Engine Design

The safety engine is the core deterministic enforcement layer.

---

## Drug Interaction Engine

### Input
- proposed medication
- current medications

### Process
1. Normalize medication names
2. Resolve drug identifiers
3. Compare medication pairs
4. Lookup interaction rules
5. Return matched alerts

### Example
Clarithromycin + Atorvastatin

Returns:
- severity
- mechanism
- clinical risk
- management recommendation

---

## Allergy Engine

### Process
Checks:
- direct allergy match
- class cross-reactivity
- severity escalation

### Example
Patient allergy:
Penicillin

Proposed medication:
Amoxicillin

Result:
HARD BLOCK

---

## Renal Dosing Engine

### Input
- medication
- patient eGFR

### Process
Evaluates:
`drug.renal_dosing.rules`

Returns:
- contraindicated
- reduce
- monitor
- adjusted dose recommendation

---

## Calculator Engine

Deterministic clinical score computation.

Implemented calculators:
- eGFR
- CHA₂DS₂-VASc

### Design Decision
Clinical scores must be exact and reproducible.

LLM estimation is not acceptable.

---

# 6. LLM Safety Constraint Flow

## Generic AI Flow

```text
Patient summary
   ↓
LLM API
   ↓
Response
```

No deterministic safety validation.

---

## Safety-Enhanced Flow

```text
Doctor question
   ↓
Patient data retrieval
   ↓
Safety engine execution
   ↓
Interaction checks
Allergy checks
Renal dosing checks
Clinical score calculation
   ↓
Constraint summary generation
   ↓
System prompt injection
   ↓
LLM API
   ↓
Safety-constrained response
```

### Design Principle
The LLM does not decide safety rules.

It only reasons within deterministic constraints.

---

# 7. API Design

## GET /api/patients
Returns patient dataset.

---

## POST /api/safety-check
Executes deterministic safety validation.

Input:
```json
{
  "patientId": 1,
  "proposedDrug": "Clarithromycin"
}
```

Output:
```json
{
  "alerts": []
}
```

---

## POST /api/claude
Handles:
- generic AI requests
- safety-enhanced AI requests

Responsibilities:
- prompt construction
- safety constraint injection
- LLM communication
- response formatting

---

# 8. Performance Considerations

## Current Design
Database-backed deterministic lookups.

Suitable for demo scale.

---

## Production Optimization

Recommended caching:
- drug catalog
- interaction rules
- allergy mappings

Benefits:
- reduce DB roundtrips
- lower latency
- O(1) lookup performance

Potential implementation:
- in-memory cache
- Redis

---

# 9. Scalability / Extensibility

## Adding New Drugs
Single DB insert.

```sql
INSERT INTO drugs (...)
```

No application logic changes.

---

## Adding New Interactions
Single DB insert.

```sql
INSERT INTO drug_interactions (...)
```

No code changes.

---

## Adding New Calculators
Register a new deterministic function.

Example:
- HAS-BLED
- Wells Score
- CURB-65

---

# 10. Safety Limitations

Current limitations:

- curated demo drug dataset
- limited interaction coverage
- no clinician override workflow
- no audit trail
- no rule versioning
- not comprehensive clinical decision support

---

# 11. Future Enhancements

Potential improvements:

- Redis distributed caching
- clinician override workflow
- audit logging
- rule versioning
- external validated drug APIs
- authentication / RBAC
- inference fallback providers
- class-based inferred interaction logic

---

# 12. Deployment Architecture

```text
Browser
   ↓
Nginx
   ↓
AWS EC2 (PM2-managed Next.js)
   ↓
Supabase
   ↓
LLM API
```

---

## Infrastructure Responsibilities

### Nginx
- TLS termination
- reverse proxy
- compression
- static asset caching
- security headers

---

### EC2
Hosts application runtime.

---

### PM2
Provides:
- process supervision
- restart recovery
- uptime resilience

---

### Supabase
Persistent structured clinical rule storage.

---

### LLM Provider
Constrained reasoning engine.

---

# 13. Security Considerations

- environment-based secret management
- API key isolation
- no PHI usage
- synthetic demo patients only
- backend-only LLM API access
- no client-side credential exposure
