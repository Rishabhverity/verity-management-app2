# Training Management System

A centralized platform for managing training operations, connecting trainers, operations, and accounts departments, streamlining workflows and improving coordination.

## Features

- **User Roles:** The system supports multiple user roles: Operations, Accounts, Trainer, and Trainee. Each role has specific functionalities and access levels.

- **Operations Dashboard:** Operations staff can add new trainers, create batches and training sessions, manage user accounts, and oversee system settings.

- **Trainer Assignments:** Operations can assign trainers to batches, and trainers can accept or reject assignments.

- **Purchase Order Management:** Track purchase orders from clients, with seamless handoff to accounts department for invoicing.

- **Accounts Management:** Generate and track invoices related to training sessions.

- **Trainee Management:** Track trainees enrolled in courses and their progress.

## Technologies Used

- Frontend: Next.js, Tailwind CSS, TypeScript
- Backend: Next.js API Routes, Prisma ORM
- Database: SQLite (can be easily switched to PostgreSQL, MySQL, etc.)
- Authentication: NextAuth.js with JWT

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Default Admin Credentials

- Email: admin@example.com
- Password: admin123

## Additional Users

- **Trainer:**
  - Email: trainer@example.com
  - Password: password123

- **Accounts:**
  - Email: accounts@example.com
  - Password: password123
