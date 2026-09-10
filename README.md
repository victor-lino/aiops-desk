AIOps Desk
An AI-powered IT operations platform built on top of a real corporate-style home lab (Active Directory, Zabbix, pfSense, Veeam, TrueNAS). The system ingests monitoring alerts and end-user tickets, and uses generative AI to produce a probable cause, impact assessment, and technical suggestion before an analyst even opens the ticket.
![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
🇧🇷 Leia em Português
The problem
Monitoring tools like Zabbix generate a constant stream of alerts, but someone still has to manually triage each one: what's the probable cause, what's the real business impact, and how urgent is it. That triage work eats into time an analyst could spend actually fixing the problem.
AIOps Desk automates that first layer of analysis, handing the analyst a ready-made diagnosis the moment a ticket is created — whether it was opened automatically from a Zabbix alert or manually by an end user.
Key features
Real LDAP authentication against an Active Directory domain, with JWT protecting every API route.
Zabbix integration: a poller watches active problems and automatically creates tickets, with per-event deduplication and a per-cycle processing limit.
AI-driven diagnosis (Gemini): every ticket gets a probable cause, organizational impact, and technical suggestion generated automatically from the problem description.
Severity-based priority fallback: if the AI is unavailable, ticket priority is inferred from Zabbix's native severity level, so no incident is ever left unclassified.
Visual SLA highlighting: unassigned critical tickets older than 10 minutes trigger an automatic visual alert; critical tickets already being worked on get a distinct, non-distracting highlight instead.
Public flow for end users: anyone can open a ticket without logging in, receives a simplified suggestion by email, and can confirm resolution with a single click.
Analyst dashboard: ticket list with search, filters by status/origin/priority, assignment, history, and re-processing of stuck tickets.
Architecture
```
Zabbix (VM) ──webhook/poller──▶ Backend (FastAPI) ──▶ PostgreSQL
                                      │
                    Active Directory ┤ (LDAP, authentication)
                                      │
                              Gemini ─┤ (AI-powered diagnosis)
                                      │
                                      ▼
                              Frontend (React)
                                      │
                                      ▼
                          Analyst / End user
```
All supporting infrastructure (Active Directory, Zabbix + Grafana, pfSense, Veeam, TrueNAS) runs on dedicated VMs simulating a real corporate environment — AIOps Desk consumes these services the same way it would in production.
More details in `architecture/`.
Tech stack
Layer	Technology
Backend	FastAPI, SQLAlchemy, Pydantic
Database	PostgreSQL
Frontend	React, TypeScript, Vite
AI	Google Gemini (google-genai)
Auth	LDAP (Active Directory) + JWT
Monitoring	Zabbix API
Infrastructure	Docker Compose, pfSense, Ubuntu Server
Running locally
```bash
git clone https://github.com/victor-lino/aiops-desk.git
cd aiops-desk

# Backend
cd backend/app
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
cp .env.example .env      # fill in your own credentials
uvicorn main:app --reload --host 0.0.0.0

# Frontend
cd ../../frontend
npm install
npm run dev
```
Or via Docker Compose (recommended for a production-like setup/demo):
```bash
docker compose up -d
```
Required environment variables are documented in `docs/environment.md`.
Documentation
`architecture/` - diagrams and architecture decisions
`docs/` AIOps Desk
An AI-powered IT operations platform built on top of a real corporate-style home lab (Active Directory, Zabbix, pfSense, Veeam, TrueNAS). The system ingests monitoring alerts and end-user tickets, and uses generative AI to produce a probable cause, impact assessment, and technical suggestion before an analyst even opens the ticket.
![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
🇧🇷 Leia em Português
The problem
Monitoring tools like Zabbix generate a constant stream of alerts, but someone still has to manually triage each one: what's the probable cause, what's the real business impact, and how urgent is it. That triage work eats into time an analyst could spend actually fixing the problem.
AIOps Desk automates that first layer of analysis, handing the analyst a ready-made diagnosis the moment a ticket is created — whether it was opened automatically from a Zabbix alert or manually by an end user.
Key features
Real LDAP authentication against an Active Directory domain, with JWT protecting every API route.
Zabbix integration: a poller watches active problems and automatically creates tickets, with per-event deduplication and a per-cycle processing limit.
AI-driven diagnosis (Gemini): every ticket gets a probable cause, organizational impact, and technical suggestion generated automatically from the problem description.
Severity-based priority fallback: if the AI is unavailable, ticket priority is inferred from Zabbix's native severity level, so no incident is ever left unclassified.
Visual SLA highlighting: unassigned critical tickets older than 10 minutes trigger an automatic visual alert; critical tickets already being worked on get a distinct, non-distracting highlight instead.
Public flow for end users: anyone can open a ticket without logging in, receives a simplified suggestion by email, and can confirm resolution with a single click.
Analyst dashboard: ticket list with search, filters by status/origin/priority, assignment, history, and re-processing of stuck tickets.
Architecture
```
Zabbix (VM) ──webhook/poller──▶ Backend (FastAPI) ──▶ PostgreSQL
                                      │
                    Active Directory ┤ (LDAP, authentication)
                                      │
                              Gemini ─┤ (AI-powered diagnosis)
                                      │
                                      ▼
                              Frontend (React)
                                      │
                                      ▼
                          Analyst / End user
```
All supporting infrastructure (Active Directory, Zabbix + Grafana, pfSense, Veeam, TrueNAS) runs on dedicated VMs simulating a real corporate environment — AIOps Desk consumes these services the same way it would in production.
More details in `architecture/`.
Tech stack
Layer	Technology
Backend	FastAPI, SQLAlchemy, Pydantic
Database	PostgreSQL
Frontend	React, TypeScript, Vite
AI	Google Gemini (google-genai)
Auth	LDAP (Active Directory) + JWT
Monitoring	Zabbix API
Infrastructure	Docker Compose, pfSense, Ubuntu Server
Running locally
```bash
git clone https://github.com/victor-lino/aiops-desk.git
cd aiops-desk

# Backend
cd backend/app
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
cp .env.example .env      # fill in your own credentials
uvicorn main:app --reload --host 0.0.0.0

# Frontend
cd ../../frontend
npm install
npm run dev
```
Or via Docker Compose (recommended for a production-like setup/demo):
```bash
docker compose up -d
```
Required environment variables are documented in `docs/environment.md`.
Documentation
`architecture/` — diagrams and architecture decisions
`docs/` — technical decisions and configuration
`monitoring/` AIOps Desk
An AI-powered IT operations platform built on top of a real corporate-style home lab (Active Directory, Zabbix, pfSense, Veeam, TrueNAS). The system ingests monitoring alerts and end-user tickets, and uses generative AI to produce a probable cause, impact assessment, and technical suggestion before an analyst even opens the ticket.
![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
🇧🇷 Leia em Português
The problem
Monitoring tools like Zabbix generate a constant stream of alerts, but someone still has to manually triage each one: what's the probable cause, what's the real business impact, and how urgent is it. That triage work eats into time an analyst could spend actually fixing the problem.
AIOps Desk automates that first layer of analysis, handing the analyst a ready-made diagnosis the moment a ticket is created — whether it was opened automatically from a Zabbix alert or manually by an end user.
Key features
Real LDAP authentication against an Active Directory domain, with JWT protecting every API route.
Zabbix integration: a poller watches active problems and automatically creates tickets, with per-event deduplication and a per-cycle processing limit.
AI-driven diagnosis (Gemini): every ticket gets a probable cause, organizational impact, and technical suggestion generated automatically from the problem description.
Severity-based priority fallback: if the AI is unavailable, ticket priority is inferred from Zabbix's native severity level, so no incident is ever left unclassified.
Visual SLA highlighting: unassigned critical tickets older than 10 minutes trigger an automatic visual alert; critical tickets already being worked on get a distinct, non-distracting highlight instead.
Public flow for end users: anyone can open a ticket without logging in, receives a simplified suggestion by email, and can confirm resolution with a single click.
Analyst dashboard: ticket list with search, filters by status/origin/priority, assignment, history, and re-processing of stuck tickets.
Architecture
```
Zabbix (VM) ──webhook/poller──▶ Backend (FastAPI) ──▶ PostgreSQL
                                      │
                    Active Directory ┤ (LDAP, authentication)
                                      │
                              Gemini ─┤ (AI-powered diagnosis)
                                      │
                                      ▼
                              Frontend (React)
                                      │
                                      ▼
                          Analyst / End user
```
All supporting infrastructure (Active Directory, Zabbix + Grafana, pfSense, Veeam, TrueNAS) runs on dedicated VMs simulating a real corporate environment — AIOps Desk consumes these services the same way it would in production.
More details in `architecture/`.
Tech stack
Layer	Technology
Backend	FastAPI, SQLAlchemy, Pydantic
Database	PostgreSQL
Frontend	React, TypeScript, Vite
AI	Google Gemini (google-genai)
Auth	LDAP (Active Directory) + JWT
Monitoring	Zabbix API
Infrastructure	Docker Compose, pfSense, Ubuntu Server
Running locally
```bash
git clone https://github.com/victor-lino/aiops-desk.git
cd aiops-desk

# Backend
cd backend/app
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
cp .env.example .env      # fill in your own credentials
uvicorn main:app --reload --host 0.0.0.0

# Frontend
cd ../../frontend
npm install
npm run dev
```
Or via Docker Compose (recommended for a production-like setup/demo):
```bash
docker compose up -d
```
Required environment variables are documented in `docs/environment.md`.
Documentation
`architecture/` — diagrams and architecture decisions
`docs/` - technical decisions and configuration
`monitoring/` - Zabbix integration, severity mapping
`troubleshooting/` - real bugs encountered and how they were fixed
`validation/` - end-to-end test evidence
`CHANGELOG.md` - version history
Author
Victor Lino - LinkedIn · GitHub
Portfolio project built to demonstrate hands-on infrastructure experience (AD, Zabbix, firewall, virtualization) combined with applying AI to a real IT operations problem.
License
MIT — see LICENSE. Zabbix integration, severity mapping
`troubleshooting/` - real bugs encountered and how they were fixed
`validation/` - end-to-end test evidence
`CHANGELOG.md` - version history
Author
Victor Lino - LinkedIn · GitHub
Portfolio project built to demonstrate hands-on infrastructure experience (AD, Zabbix, firewall, virtualization) combined with applying AI to a real IT operations problem.
License
MIT — see LICENSE. technical decisions and configuration
`monitoring/` - Zabbix integration, severity mapping
`troubleshooting/` - real bugs encountered and how they were fixed
`validation/` - end-to-end test evidence
`CHANGELOG.md` - version history
Author
Victor Lino - LinkedIn · GitHub
Portfolio project built to demonstrate hands-on infrastructure experience (AD, Zabbix, firewall, virtualization) combined with applying AI to a real IT operations problem.
License
MIT - see LICENSE.
