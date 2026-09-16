# College AV Room Equipment Rental System

# Project Overview

The **College AV Room Equipment Rental System** is a web-based application designed to manage the borrowing and returning of audio-visual (AV) equipment in a college.

The college AV room lends equipment such as:

* DSLR Cameras
* Projectors
* Microphones
* Tripods
* Speakers
* Other AV equipment

Currently, equipment lending may be managed using a paper register, which can make it difficult to know which items are available, who has borrowed an item, and when it is due back.

This project provides a simple digital solution for tracking equipment, active loans, due dates, and borrower transfers.

---

##  Problem Statement

The college AV room needs a system that can:

1. Keep track of all available equipment.
2. Support multiple units of the same equipment.
3. Record who has borrowed each item.
4. Track the checkout and due dates.
5. Prevent the same physical item from being loaned to two borrowers at the same time.
6. Allow an active loan to be transferred from one borrower to another.
7. Preserve the original due date when a loan is transferred.
8. Keep the equipment's availability unchanged when a transfer occurs.

### The Twist

An important requirement of the system is:

> **An active loan can be transferred from one borrower to another. The original due date remains unchanged, and the item's availability is unaffected by the transfer.**

For example:

* Club A borrows Camera #2.
* Due date is September 20.
* Club A transfers the loan to Club B.
* Club B now becomes responsible for Camera #2.
* The due date remains September 20.
* Camera #2 remains unavailable because it is still actively loaned.

---

#  Features

## 1. Equipment Management

The system maintains a list of AV equipment and individual physical units.

Each equipment unit can have information such as:

* Equipment name
* Category
* Unit/asset identifier
* Availability status

Examples:

```text
Projector - PJ-001
Projector - PJ-002
Camera - CAM-001
Microphone - MIC-001
Tripod - TRP-001
```

This allows the system to distinguish between multiple physical units of the same equipment.

---

## 2. Equipment Availability

The system keeps track of whether an individual equipment unit is:

* Available
* Currently on loan

An item that is already on an active loan cannot be checked out to another borrower.

This helps prevent double-booking of the same physical equipment.

---

## 3. Create a Loan

A borrower can check out an available equipment unit by providing:

* Borrower name
* Equipment unit
* Start date
* Due date

Once the loan is created, the equipment becomes unavailable.

Example:

```text
Borrower: Photography Club
Equipment: Camera CAM-001
From: 16-09-2026
Due: 20-09-2026
Status: Active
```

---

## 4. Return Equipment

When equipment is returned, the active loan is closed and the equipment becomes available again.

The system can therefore distinguish between:

```text
Active Loan
Returned Loan
```

---

## 5. Transfer an Active Loan

The system supports transferring an existing active loan from one borrower to another.

For example:

```text
Before Transfer

Borrower: Film Club
Equipment: Projector PJ-002
From: 16-09-2026
Due: 20-09-2026
```

After transferring:

```text
Borrower: Photography Club
Equipment: Projector PJ-002
From: 16-09-2026
Due: 20-09-2026
```

Only the borrower changes.

The following remain unchanged:

* Equipment unit
* Original start date
* Original due date
* Loan status
* Equipment availability

---

## 6. Transfer History

Transfers are recorded so that the system can maintain a history of borrower changes.

This provides better traceability than simply overwriting the previous borrower.

A transfer can record:

* Previous borrower
* New borrower
* Transfer date
* Associated loan

---

## 7. Dashboard

The application provides a simple dashboard showing the current state of the AV room.

Useful information includes:

* Total equipment units
* Available equipment
* Currently loaned equipment
* Active loans

This gives AV room staff a quick overview of equipment usage.

---

# 🏗️ System Architecture

The project uses a simple client-server architecture.

```text
┌──────────────────────────┐
│       Frontend           │
│   HTML + CSS + JavaScript│
└────────────┬─────────────┘
             │
             │ HTTP / REST API
             ▼
┌──────────────────────────┐
│       Node.js Server     │
│         Express.js       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       Data Storage       │
│        JSON / File       │
└──────────────────────────┘
```

The frontend communicates with the Express backend through REST API endpoints.

---

# Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript
* Fetch API

### Backend

* Node.js
* Express.js

### Development Environment

* GitHub
* GitHub Codespaces
* Git

### Data Storage

The current implementation uses local file-based storage for simplicity.

---

#  Project Structure

```text
college-av-room/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── data/
│   └── data.json
│
├── server.js
├── package.json
├── package-lock.json
│
├── README.md
├── reasoning.md
└── AI_LOGS.md
```

> The exact filenames may vary slightly depending on the final implementation.

---

# API Overview

The Express server provides REST API endpoints for interacting with the application.

Typical operations include:

### Equipment

```http
GET /api/equipment
```

Returns the available equipment and their current status.

### Loans

```http
GET /api/loans
```

Returns loan records.

### Create Loan

```http
POST /api/loans
```

Creates a new equipment loan.

### Return Loan

```http
PUT /api/loans/:id/return
```

Marks an active loan as returned.

### Transfer Loan

```http
PUT /api/loans/:id/transfer
```

Transfers an active loan to another borrower.

The transfer operation changes the borrower while preserving the original loan dates and equipment availability.

---

# Loan Lifecycle

A typical equipment loan follows this lifecycle:

```text
Available
    │
    ▼
Checked Out
    │
    ├───────────────┐
    │               │
    ▼               ▼
 Returned       Transferred
    │               │
    ▼               ▼
Available       Still On Loan
                    │
                    ▼
                 Returned
                    │
                    ▼
                 Available
```

A transfer does **not** create a new equipment availability period.

It simply changes the borrower associated with the existing active loan.

---

# Important Business Rules

The following rules are enforced by the application.

### Rule 1 — Only available equipment can be checked out

An equipment unit with an active loan cannot be checked out again.

### Rule 2 — Due date is required

Every active loan must have a due date.

### Rule 3 — Due date cannot be changed during transfer

When an active loan is transferred, the original due date is preserved.

### Rule 4 — Equipment remains unavailable after transfer

A transfer does not mean that the equipment has been returned.

The item remains on the active loan.

### Rule 5 — Only active loans can be transferred

A completed/returned loan cannot be transferred.

### Rule 6 — A transfer changes the borrower, not the equipment

The same physical equipment unit remains associated with the loan.

---

# Running the Project

## 1. Clone the repository

```bash
git clone <repository-url>
cd <project-folder>
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start the server

```bash
node server.js
```

The application will start on the configured local port.

For example:

```text
http://localhost:3001
```

---

# Running in GitHub Codespaces

This project can be developed and tested directly using **GitHub Codespaces**.

### Steps

1. Open the GitHub repository.
2. Click **Code**.
3. Open the **Codespaces** tab.
4. Create a new Codespace.
5. Wait for the development environment to start.
6. Open the terminal.
7. Install dependencies:

```bash
npm install
```

8. Start the server:

```bash
node server.js
```

9. Open the forwarded port shown by Codespaces.

---

# Example Scenario

Suppose the AV room has:

```text
Camera CAM-001
Camera CAM-002
Projector PJ-001
Projector PJ-002
Microphone MIC-001
```

The Photography Club checks out:

```text
Equipment: CAM-001
Borrower: Photography Club
From: 16-09-2026
Due: 20-09-2026
```

`CAM-001` is now unavailable.

Later, the Photography Club transfers the loan to the Film Club.

The system changes:

```text
Borrower:
Photography Club → Film Club
```

But keeps:

```text
Equipment: CAM-001
From: 16-09-2026
Due: 20-09-2026
Status: Active
Availability: Unavailable
```

This satisfies the main twist of the problem.

---

# Data Integrity

The backend is responsible for validating important operations rather than relying only on the frontend.

For example, before creating a loan, the server checks whether the selected equipment unit already has an active loan.

Similarly, a transfer is only allowed when the referenced loan is currently active.

This prevents invalid operations from being created by directly calling the API.

---

# Purpose of the Project

This project demonstrates how a real-world college process can be converted from a manual register into a simple digital system.

The main focus is not on building a complicated enterprise application, but on correctly handling:

* Equipment inventory
* Individual equipment units
* Availability
* Loans
* Dates
* Returns
* Borrower transfers
* Data consistency

The project was developed as part of a college build challenge using GitHub Codespaces.

---

# Possible Future Improvements

The current version can be extended with:

* Student/club authentication
* Admin login
* Search and filtering
* Overdue loan notifications
* Email notifications
* Equipment maintenance tracking
* QR/barcode scanning
* Database integration
* Loan history reports
* User roles and permissions
* Audit logs
* Better mobile responsiveness

---

# Supporting Files

### `reasoning.md`

Contains the reasoning and design decisions behind the solution, including how the main problem and the loan-transfer requirement were approached.

### `AI_LOGS.md`

Contains the development conversation/logs used while building the project with AI assistance.

