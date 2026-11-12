# Jobify — Job Tracking & Openings Application

A full-stack job posting and application tracking web application built with **React + Vite** and **Node.js + Express**, styled with a **Deep Burnt Orange** primary and **Muted Rose / Taupe** (`#9F1239` / `#A8A29E`) secondary palette, with a bottom-right **Light / Dark Mode** toggle.

## Features

### Admin
- **Post & Manage Job Openings**: Create, edit, open/close/draft, and delete job listings with department, location, work mode, employment type, salary range, deadline, responsibilities, and requirements.
- **Shareable Job Links**: Copy direct job links (`/jobs/<id>`) straight from the Admin table or any job card.
- **Applicant Tracking**: View all candidates per job or across the organization, inspect cover letters, download uploaded resumes, update application status (`Submitted`, `Under Review`, `Interview`, `Offer`, `Rejected`), and add recruiter notes.

### Normal User (Applicant)
- **Browse & Filter Jobs**: Search by keyword and filter by department, work mode (`Remote`, `Hybrid`, `On-site`), and employment type.
- **One-Step Apply & Share**: Open shared job links directly, share links with others, and submit applications (with cover note and optional resume upload) with or without pre-registering.
- **Track Applications**: Visual pipeline stepper (`Submitted` → `Under Review` → `Interview` → `Offer`), recruiter updates, resume download, and ability to withdraw active applications.

## Demo Accounts
- **Admin**: `admin@jobify.io` / `admin123`
- **Normal User**: `user@jobify.io` / `user123`

(One-click demo buttons are also available in the Sign In modal.)

## Running Locally

### Production / Single-Server Mode (serves built UI + API on port 3001)
```bash
npm run build
npm start
```
Then open `http://localhost:3001`.

### Development Mode (Vite HMR + API server)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
