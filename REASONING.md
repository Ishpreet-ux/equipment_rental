# Reasoning

## 1. Understanding the Problem

The college AV room currently uses a paper register to manage equipment such as DSLR cameras, projectors, microphones, and tripods.

The main problem is not simply that the register is on paper. The bigger issue is that the register does not provide a reliable, up-to-date view of:

* What equipment is available
* How many units of an item are available
* Who has borrowed an item
* When the item should be returned
* Whether an item is already booked
* Which items are overdue
* How much late fee a borrower owes
* How much refundable deposit should be returned

This creates practical problems such as two clubs trying to borrow the same projector, students not knowing whether a DSLR is available, and equipment being kept for too long.

Therefore, the system should first make the core lending process reliable:

**Equipment → Borrow → Availability → Return**

After that, additional rules such as deposits, late fees, and borrowing limits can be added.

---

## 2. Main Goal

The goal is to build a simple AV equipment lending system that replaces the unreliable paper register with a centralized digital record.

The system should allow the AV room staff to:

1. Add and manage equipment.
2. Track multiple units of the same equipment.
3. Record borrowers and their bookings.
4. Check equipment availability.
5. Issue equipment to a borrower.
6. Set a sensible return date.
7. Record returns.
8. Identify overdue equipment.
9. Calculate late fees.
10. Track refundable deposits.
11. Prevent a single person from borrowing an unreasonable number of items.
12. Provide reminders/nudges for overdue returns.

The focus is on making the basic lending workflow dependable before adding more advanced features.

---

## 3. Identifying the Important Users

There are two main types of users involved.

### AV Room Staff

The staff member needs to:

* View available equipment.
* Check current bookings.
* Issue equipment.
* Record returns.
* See overdue equipment.
* Track deposits and late fees.
* Manage equipment records.

### Borrower

The borrower is usually a student, club, or college group.

They need to:

* Know whether an item is available.
* Request/book equipment.
* See their borrowing details.
* Know the expected return date.
* Know whether they have an overdue item.
* Receive a reminder when the return date is approaching or has passed.

---

## 4. Core Entities

I would model the system around a few simple entities rather than creating unnecessary complexity.

### Equipment

Represents an equipment type.

Example:

```text
Equipment
- DSLR Camera
- Projector
- Microphone
- Tripod
```

Important fields could include:

```text
id
name
category
total_quantity
available_quantity
deposit_amount
late_fee_per_day
```

Because popular equipment can have several units, quantity needs to be tracked rather than treating every equipment type as a single item.

---

### Borrower

Represents the student or club borrowing equipment.

Possible fields:

```text
id
name
email
phone
borrower_type
```

`borrower_type` could distinguish between a student and a club if required.

---

### Booking / Loan

This represents the actual borrowing transaction.

Possible fields:

```text
id
equipment_id
borrower_id
quantity
booking_date
borrow_date
due_date
return_date
status
deposit_amount
late_fee
```

The status can be something such as:

```text
BOOKED
BORROWED
RETURNED
OVERDUE
CANCELLED
```

Keeping the booking/loan information separate from the equipment record makes it possible to maintain a history of previous transactions.

---

## 5. Availability Logic

Availability is one of the most important parts of the problem because the paper register currently causes conflicts.

For equipment with multiple units:

```text
Available Quantity =
Total Quantity - Currently Borrowed/Reserved Quantity
```

For example:

```text
Projectors = 3
Currently booked/borrowed = 2

Available = 1
```

If another club requests 2 projectors, the system should not allow the booking because only 1 is available.

This prevents situations where two people are promised the same equipment.

Availability should also consider the requested dates, not just the current quantity.

For example:

```text
Projector A
Booked: September 20 - September 22
```

A different borrower should still be able to book it for September 25 if there is no conflicting booking.

---

## 6. Borrowing Workflow

The main workflow should be kept simple.

### Step 1 — Check Availability

The staff or borrower searches for equipment.

The system shows:

```text
Projector
Total: 3
Available: 2
```

The borrower can then request the required quantity and dates.

### Step 2 — Create Booking

If enough units are available, the system creates a booking.

The system should record:

* Borrower
* Equipment
* Quantity
* Booking dates
* Due date
* Deposit

### Step 3 — Issue Equipment

When the equipment is actually collected, the booking can become:

```text
BORROWED
```

The available quantity is updated.

### Step 4 — Return Equipment

When the borrower returns the equipment, the staff records the return date.

The system calculates whether the return is late.

### Step 5 — Close Transaction

The equipment becomes available again and the final deposit amount can be calculated.

---

## 7. Return Date

A return date is important because the current paper system does not provide enough control over how long students keep equipment.

The system should require a due date when equipment is borrowed.

For example:

```text
Borrowed: 10 September
Due: 13 September
```

The exact maximum borrowing duration can be configured according to the college's rules rather than hard-coding an arbitrary value.

This also makes it easier to identify overdue equipment.

---

## 8. Late Fee Calculation

The problem statement specifies a small per-day late fee.

The basic calculation is:

```text
Late Days = Return Date - Due Date
```

If the result is negative or zero:

```text
Late Fee = ₹0
```

If the borrower returns the equipment late:

```text
Late Fee = Late Days × Late Fee Per Day
```

For example:

```text
Due Date: 10 September
Return Date: 13 September
Late Fee: ₹20/day

Late Days = 3
Late Fee = 3 × ₹20
         = ₹60
```

The late fee should be calculated when the item is returned so that the final amount is based on the actual return date.

---

## 9. Deposit Logic

A refundable deposit provides another layer of accountability.

When equipment is borrowed:

```text
Deposit Collected = ₹500
```

If the equipment is returned on time:

```text
Late Fee = ₹0
Refund = ₹500
```

If it is returned late:

```text
Deposit = ₹500
Late Fee = ₹60

Refund = ₹500 - ₹60
       = ₹440
```

The system should store the original deposit and the calculated deduction separately so that the transaction remains understandable.

The problem statement specifically mentions the deposit being returned after deducting late fees, so I would keep the initial implementation focused on this rule rather than introducing a complicated payment system.

---

## 10. Borrowing Limit

One person should not be able to book out half of the AV room.

Therefore, the system should have a borrowing limit.

For example:

```text
Maximum active items per borrower = configurable value
```

Before creating a booking, the system checks the borrower's current active quantity.

If the borrower has already reached the limit, the new booking is rejected.

The limit should be configurable because the college may decide that students and clubs have different limits.

This check should happen on the backend rather than only in the frontend so that it cannot be bypassed by directly sending a request to the API.

---

## 11. Overdue Tracking and Nudges

The system should make overdue equipment visible instead of relying on someone remembering to check a paper register.

A booking becomes overdue when:

```text
Current Date > Due Date
AND
Return Date is empty
```

The dashboard can show something like:

```text
Overdue Items: 4
```

Each overdue record can display:

```text
Borrower
Equipment
Due Date
Days Late
Current Late Fee
```

The system can also provide reminders/nudges.

For example:

```text
Your DSLR Camera is due tomorrow.
Please return it to the AV Room.
```

And after the due date:

```text
Your DSLR Camera is overdue by 2 days.
Current late fee: ₹40.
Please return it as soon as possible.
```

For the first version, these nudges can be implemented as in-app notifications or dashboard alerts. Actual email/SMS notifications can be added later if required.

---

## 12. Dashboard

The dashboard should answer the most common questions quickly.

The important information should be visible without requiring the staff to inspect individual records.

For example:

```text
Total Equipment
Available Items
Currently Borrowed
Overdue
Upcoming Returns
```

There should also be an equipment list showing:

```text
Equipment       Total    Available    Status
------------------------------------------------
DSLR Camera       5          2        Available
Projector         3          0        Fully Booked
Microphone        8          6        Available
Tripod            6          6        Available
```

This directly addresses the question:

> "Is a DSLR free this weekend?"

---

## 13. Search and Filtering

Since the AV room may contain many items, users should be able to search for equipment.

Useful filters include:

* Equipment name
* Category
* Availability
* Borrower
* Booking status
* Overdue status
* Date range

The most important initial search is equipment availability.

---

## 14. Validation

The backend should validate important operations.

Examples:

### Booking

Do not allow:

* Quantity less than 1
* Booking when insufficient quantity is available
* Invalid dates
* Booking beyond the borrower's limit

### Return

Do not allow:

* Returning an already returned booking
* Returning an item that was never issued

### Equipment

Do not allow:

* Negative quantities
* Negative late fees
* Invalid deposit amounts

Frontend validation improves user experience, but backend validation is required for actual data integrity.

---

## 15. Data Consistency

A major purpose of the application is to solve the problem caused by an unreliable paper register.

Therefore, the database should be the source of truth.

For example, when a projector is borrowed:

```text
Before:
Total = 3
Available = 3

After borrowing 1:
Total = 3
Available = 2
```

When the projector is returned:

```text
Available = 3
```

These changes should happen together with the corresponding booking/return transaction so that the system does not show contradictory information.

---

## 16. Suggested API Structure

If the application uses a REST API, the main endpoints can be organized around the core resources.

### Equipment

```text
GET    /api/equipment
POST   /api/equipment
GET    /api/equipment/:id
PUT    /api/equipment/:id
DELETE /api/equipment/:id
```

### Borrowers

```text
GET    /api/borrowers
POST   /api/borrowers
GET    /api/borrowers/:id
```

### Bookings / Loans

```text
GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
```

### Returns

```text
POST   /api/bookings/:id/return
```

The return endpoint can calculate the late fee and refundable deposit as part of closing the transaction.

---

## 17. Database Design

A relational database is suitable because the system contains relationships between borrowers, equipment, and bookings.

A simple structure could be:

```text
equipment
    |
    | 1
    |
    | many
bookings
    |
    | many
    |
borrowers
```

The `bookings` table connects the borrower and equipment.

This also allows the system to maintain a complete borrowing history instead of overwriting old register entries.

---

## 18. Edge Cases Considered

Some situations need to be handled explicitly.

### Multiple Units

If there are 5 microphones and 2 are already borrowed, only 3 should be available.

### Partial Availability

If a borrower requests 3 projectors but only 2 are available, the booking should not automatically become a 2-projector booking unless partial fulfillment is an explicitly supported rule.

### Overdue Return

The system should calculate the fee based on the actual number of late days.

### Early Return

If an item is returned before the due date, the late fee should remain zero.

### Same-Day Return

A return on the due date should not be considered late.

### Borrowing Limit

The system should count active borrowed/reserved items when checking the limit, rather than counting completed historical transactions.

### Cancelled Booking

Cancelled bookings should not continue reducing available quantity.

### Multiple Bookings

Availability must be checked against overlapping dates to avoid double-booking.

---

## 19. Development Priority

The problem statement itself suggests building the system in stages.

Therefore, I would prioritize the implementation as follows.

### Phase 1 — Core Lending

* Equipment management
* Quantity tracking
* Borrower management
* Booking
* Availability
* Return tracking

This is the minimum system needed to replace the paper register.

### Phase 2 — Accountability

* Due dates
* Overdue detection
* Late fee calculation
* Deposit calculation

### Phase 3 — Control

* Borrowing limits
* Validation
* Booking conflict prevention

### Phase 4 — Nudges

* Upcoming-return reminders
* Overdue alerts
* Dashboard notifications

This approach prevents secondary features from making the basic borrowing workflow unreliable.

---

## 20. Design Decisions

### Why track quantities?

Because the problem explicitly states that popular items can have several units. Treating a DSLR or projector as a single record would not accurately represent availability.

### Why keep booking history?

The AV room should be able to determine who borrowed equipment and what happened to it previously. Historical records also help staff investigate missing or repeatedly overdue equipment.

### Why calculate fees at return time?

The final late fee depends on the actual return date, so it cannot be finalized when the equipment is initially borrowed.

### Why make limits configurable?

The college may change its lending policy. Configuration avoids having to change application logic whenever the policy changes.

### Why start with in-app nudges?

The core problem is tracking. A reminder system is useful, but reliable lending and return data should exist first. External email/SMS services can be integrated later.

---

## 21. Security and Data Integrity

The application should not rely only on frontend restrictions.

Important operations such as:

* Creating a booking
* Updating availability
* Calculating fees
* Applying borrowing limits
* Recording returns

should be handled and validated on the server.

If authentication is included, staff-only actions such as adding equipment or modifying inventory should require appropriate permissions.

The application should also avoid exposing unnecessary borrower information to other users.

---

## 22. What Success Looks Like

The system should be successful if an AV room staff member can answer the following questions immediately:

> How many projectors are available?

> Who currently has the DSLR cameras?

> Is a projector available for a particular weekend?

> When is this equipment due back?

> Which items are overdue?

> How much late fee does the borrower owe?

> How much of the deposit should be refunded?

> Has this borrower reached their borrowing limit?

If these questions can be answered reliably from the application, the system has solved the main problem described in the paper-register scenario.

---

## 23. Final Approach

I would build the solution around a simple lending lifecycle:

```text
                    ┌──────────────┐
                    │   Equipment  │
                    └──────┬───────┘
                           │
                           ▼
                    Check Availability
                           │
                           ▼
                    ┌──────────────┐
                    │    Booking   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Borrowed   │
                    └──────┬───────┘
                           │
                    Due Date Reached
                           │
              ┌────────────┴────────────┐
              │                         │
          Returned                   Not Returned
              │                         │
              ▼                         ▼
       Calculate Fee                Overdue
              │                         │
              └────────────┬────────────┘
                           ▼
                       Return
                           │
                           ▼
                  Refund Deposit
                           │
                           ▼
                     Available
```

The central principle is to keep the first version **simple, reliable, and focused on the actual problem**.

Instead of trying to build a large management platform immediately, the implementation should first make borrowing, availability, and returns accurate. Deposits, late fees, borrowing limits, and reminders can then build on top of that reliable foundation.
