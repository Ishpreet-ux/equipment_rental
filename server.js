const express = require("express");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const today = () => new Date().toISOString().split("T")[0];

function dateDiff(date1, date2) {
    const a = new Date(date1);
    const b = new Date(date2);
    return Math.ceil((a - b) / (1000 * 60 * 60 * 24));
}

/* Equipment */

app.get("/api/equipment", (req, res) => {
    const equipment = db.prepare(`
        SELECT
            et.id,
            et.name,
            et.total_units,
            et.deposit_amount,
            et.daily_late_fee,
            COUNT(
                CASE
                    WHEN u.status = 'available'
                    AND l.id IS NULL
                    THEN 1
                END
            ) AS available_units
        FROM equipment_types et
        LEFT JOIN units u
            ON u.equipment_type_id = et.id
        LEFT JOIN loans l
            ON l.unit_id = u.id
            AND l.status = 'active'
        GROUP BY et.id
    `).all();

    res.json(equipment);
});

/* Borrowers */

app.get("/api/borrowers", (req, res) => {
    const borrowers = db.prepare(`
        SELECT * FROM borrowers
        ORDER BY name
    `).all();

    res.json(borrowers);
});

/* Availability */

app.get("/api/equipment/:id/availability", (req, res) => {

    const { id } = req.params;
    const from = req.query.from;
    const to = req.query.to;

    if (!from || !to) {
        return res.status(400).json({
            error: "from and to dates are required"
        });
    }

    const available = db.prepare(`
        SELECT u.*
        FROM units u
        WHERE u.equipment_type_id = ?
        AND u.status = 'available'
        AND NOT EXISTS (
            SELECT 1
            FROM loans l
            WHERE l.unit_id = u.id
            AND l.status = 'active'
            AND l.checkout_date <= ?
            AND l.due_date >= ?
        )
    `).all(id, to, from);

    res.json({
        available: available.length > 0,
        units: available
    });
});

/* Create loan */

app.post("/api/loans", (req, res) => {

    const {
        equipment_type_id,
        borrower_id,
        days = 3
    } = req.body;

    const equipmentTypeId = Number(equipment_type_id);
    const borrowerId = Number(borrower_id);
    const loanDays = Number(days);

    if (!Number.isInteger(equipmentTypeId) || equipmentTypeId < 1) {
        return res.status(400).json({
            error: "A valid equipment type is required."
        });
    }

    if (!Number.isInteger(borrowerId) || borrowerId < 1) {
        return res.status(400).json({
            error: "A valid borrower is required."
        });
    }

    if (!Number.isInteger(loanDays) || loanDays < 1 || loanDays > 30) {
        return res.status(400).json({
            error: "Days must be a whole number between 1 and 30."
        });
    }

    const borrower = db.prepare(`
        SELECT id FROM borrowers
        WHERE id = ?
    `).get(borrowerId);

    if (!borrower) {
        return res.status(400).json({
            error: "Borrower not found."
        });
    }

    const equipment = db.prepare(`
        SELECT * FROM equipment_types
        WHERE id = ?
    `).get(equipmentTypeId);

    if (!equipment) {
        return res.status(400).json({
            error: "Equipment type not found."
        });
    }

    const activeLoans = db.prepare(`
        SELECT COUNT(*) AS count
        FROM loans
        WHERE borrower_id = ?
        AND status = 'active'
    `).get(borrowerId);

    if (activeLoans.count >= 3) {
        return res.status(400).json({
            error: "Borrower already has 3 active items."
        });
    }

    const unit = db.prepare(`
        SELECT u.*
        FROM units u
        WHERE u.equipment_type_id = ?
        AND u.status = 'available'
        AND NOT EXISTS (
            SELECT 1
            FROM loans l
            WHERE l.unit_id = u.id
            AND l.status = 'active'
        )
        LIMIT 1
    `).get(equipmentTypeId);

    if (!unit) {
        return res.status(400).json({
            error: "No unit is currently available."
        });
    }

    const checkout = today();

    const due = new Date();
    due.setDate(due.getDate() + loanDays);

    const dueDate = due.toISOString().split("T")[0];

    const result = db.prepare(`
        INSERT INTO loans
        (
            unit_id,
            borrower_id,
            checkout_date,
            due_date,
            deposit_collected,
            status
        )
        VALUES (?, ?, ?, ?, ?, 'active')
    `).run(
        unit.id,
        borrowerId,
        checkout,
        dueDate,
        equipment.deposit_amount
    );

    res.json({
        success: true,
        loan_id: result.lastInsertRowid,
        unit_code: unit.unit_code,
        due_date: dueDate,
        deposit: equipment.deposit_amount
    });
});

/* Transfer an active loan */

app.post("/api/loans/:id/transfer", (req, res) => {

    const loanId = Number(req.params.id);
    const newBorrowerId = Number(req.body.borrower_id);

    if (!Number.isInteger(loanId) || loanId < 1) {
        return res.status(400).json({
            error: "A valid loan is required."
        });
    }

    if (!Number.isInteger(newBorrowerId) || newBorrowerId < 1) {
        return res.status(400).json({
            error: "A valid borrower is required."
        });
    }

    const loan = db.prepare(`
        SELECT id, borrower_id, due_date, status
        FROM loans
        WHERE id = ?
    `).get(loanId);

    if (!loan) {
        return res.status(404).json({
            error: "Loan not found."
        });
    }

    if (loan.status !== "active") {
        return res.status(400).json({
            error: "Only active loans can be transferred."
        });
    }

    if (loan.borrower_id === newBorrowerId) {
        return res.status(400).json({
            error: "The loan already belongs to this borrower."
        });
    }

    const newBorrower = db.prepare(`
        SELECT id FROM borrowers
        WHERE id = ?
    `).get(newBorrowerId);

    if (!newBorrower) {
        return res.status(400).json({
            error: "Borrower not found."
        });
    }

    const activeLoanCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM loans
        WHERE borrower_id = ?
        AND status = 'active'
    `).get(newBorrowerId);

    if (activeLoanCount.count >= 3) {
        return res.status(400).json({
            error: "Borrower already has 3 active items."
        });
    }

    const transfer = db.transaction(() => {
        db.prepare(`
            INSERT INTO loan_transfers
            (loan_id, from_borrower_id, to_borrower_id, transferred_at)
            VALUES (?, ?, ?, ?)
        `).run(loan.id, loan.borrower_id, newBorrowerId, today());

        db.prepare(`
            UPDATE loans
            SET borrower_id = ?
            WHERE id = ?
        `).run(newBorrowerId, loan.id);
    });

    transfer();

    res.json({
        success: true,
        loan_id: loan.id,
        borrower_id: newBorrowerId,
        due_date: loan.due_date
    });
});

/* Active loans */

app.get("/api/loans", (req, res) => {

    const loans = db.prepare(`
        SELECT
            l.*,
            u.unit_code,
            et.name AS equipment_name,
            b.name AS borrower_name,
            b.student_id
        FROM loans l
        JOIN units u ON u.id = l.unit_id
        JOIN equipment_types et
            ON et.id = u.equipment_type_id
        JOIN borrowers b
            ON b.id = l.borrower_id
        WHERE l.status = 'active'
        ORDER BY l.due_date
    `).all();

    const result = loans.map(loan => ({
        ...loan,
        overdue_days: Math.max(0, dateDiff(today(), loan.due_date))
    }));

    res.json(result);
});

/* Return */

app.post("/api/loans/:id/return", (req, res) => {

    const loan = db.prepare(`
        SELECT
            l.*,
            et.daily_late_fee
        FROM loans l
        JOIN units u ON u.id = l.unit_id
        JOIN equipment_types et
            ON et.id = u.equipment_type_id
        WHERE l.id = ?
    `).get(req.params.id);

    if (!loan) {
        return res.status(404).json({
            error: "Loan not found."
        });
    }

    if (loan.status === "returned") {
        return res.status(400).json({
            error: "This loan has already been returned."
        });
    }

    const returnDate = today();

    const lateDays = Math.max(
        0,
        dateDiff(returnDate, loan.due_date)
    );

    const lateFee = lateDays * loan.daily_late_fee;

    const refund = Math.max(
        0,
        loan.deposit_collected - lateFee
    );

    const transaction = db.transaction(() => {

        db.prepare(`
            UPDATE loans
            SET
                return_date = ?,
                late_fee_charged = ?,
                deposit_refunded = ?,
                status = 'returned'
            WHERE id = ?
        `).run(
            returnDate,
            lateFee,
            refund,
            loan.id
        );

        db.prepare(`
            UPDATE units
            SET status = 'available'
            WHERE id = ?
        `).run(loan.unit_id);
    });

    transaction();

    res.json({
        success: true,
        late_days: lateDays,
        late_fee: lateFee,
        deposit_refunded: refund
    });
});
app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `AV Room server running on port ${PORT}`
    );

});