const db = require("./db");

db.exec(`
DELETE FROM loans;
DELETE FROM units;
DELETE FROM borrowers;
DELETE FROM equipment_types;
`);

const equipment = [
    ["DSLR Camera", 3, 100, 2000],
    ["Projector", 2, 150, 3000],
    ["Microphone", 4, 50, 500],
    ["Tripod", 3, 30, 300]
];

const insertEquipment = db.prepare(`
    INSERT INTO equipment_types
    (name, total_units, daily_late_fee, deposit_amount)
    VALUES (?, ?, ?, ?)
`);

const insertUnit = db.prepare(`
    INSERT INTO units
    (equipment_type_id, unit_code)
    VALUES (?, ?)
`);

for (const item of equipment) {
    const result = insertEquipment.run(...item);

    const equipmentId = result.lastInsertRowid;

    for (let i = 1; i <= item[1]; i++) {
        insertUnit.run(
            equipmentId,
            `${item[0].substring(0, 4).toUpperCase()}-${String(i).padStart(2, "0")}`
        );
    }
}

const insertBorrower = db.prepare(`
    INSERT INTO borrowers
    (name, student_id, email)
    VALUES (?, ?, ?)
`);

insertBorrower.run("Aarav Sharma", "STU001", "aarav@example.com");
insertBorrower.run("Priya Singh", "STU002", "priya@example.com");
insertBorrower.run("Rahul Verma", "STU003", "rahul@example.com");

console.log("Database seeded successfully.");