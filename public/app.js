let borrowers = [];


async function loadEquipment() {

    const response = await fetch("/api/equipment");
    const equipment = await response.json();

    const container = document.getElementById("equipment");
    const select = document.getElementById("equipmentSelect");

    container.innerHTML = "";
    select.innerHTML = "";

    equipment.forEach(item => {

        const available = item.available_units > 0;

        container.innerHTML += `
            <div class="card">

                <h3>${item.name}</h3>

                <p>
                    ${item.available_units}
                    / ${item.total_units}
                    available
                </p>

                <p class="${available ? "available" : "unavailable"}">
                    ${available ? "Available" : "Currently unavailable"}
                </p>

                <small>
                    Deposit: ₹${item.deposit_amount}
                </small>

            </div>
        `;

        select.innerHTML += `
            <option value="${item.id}">
                ${item.name}
            </option>
        `;
    });
}


async function loadBorrowers() {

    const response = await fetch("/api/borrowers");
    borrowers = await response.json();

    const select = document.getElementById("borrowerSelect");

    select.innerHTML = "";

    borrowers.forEach(borrower => {

        select.innerHTML += `
            <option value="${borrower.id}">
                ${borrower.name} (${borrower.student_id})
            </option>
        `;
    });
}


async function loadLoans() {

    const response = await fetch("/api/loans");
    const loans = await response.json();

    const container = document.getElementById("loans");

    if (loans.length === 0) {

        container.innerHTML = `
            <p>No active loans.</p>
        `;

        return;
    }

    container.innerHTML = "";

    loans.forEach(loan => {

        const overdue = loan.overdue_days > 0;
        const transferOptions = borrowers
            .filter(borrower => borrower.id !== loan.borrower_id)
            .map(borrower => `
                <option value="${borrower.id}">
                    ${borrower.name} (${borrower.student_id})
                </option>
            `)
            .join("");

        container.innerHTML += `
            <div class="loan ${overdue ? "overdue" : "due-soon"}">

                <div>

                    <strong>
                        ${loan.equipment_name}
                    </strong>

                    <p>
                        Unit: ${loan.unit_code}
                    </p>

                    <p>
                        Borrower:
                        ${loan.borrower_name}
                        (${loan.student_id})
                    </p>

                    <p>
                        Due:
                        ${loan.due_date}
                    </p>

                    ${
                        overdue
                        ? `<strong>
                            ${loan.overdue_days} day(s) overdue
                           </strong>`
                        : `<span>Not overdue</span>`
                    }

                </div>

                <div class="loan-actions">
                    <button onclick="returnLoan(${loan.id})">
                        Return
                    </button>

                    <select id="transfer-${loan.id}" aria-label="Transfer loan to another borrower">
                        <option value="">Transfer to...</option>
                        ${transferOptions}
                    </select>

                    <button onclick="transferLoan(${loan.id})">
                        Transfer
                    </button>
                </div>

            </div>
        `;
    });
}


document
    .getElementById("borrowForm")
    .addEventListener("submit", async event => {

        event.preventDefault();

        const equipment_type_id =
            document.getElementById("equipmentSelect").value;

        const borrower_id =
            document.getElementById("borrowerSelect").value;

        const days =
            document.getElementById("days").value;

        const response = await fetch("/api/loans", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                equipment_type_id,
                borrower_id,
                days
            })

        });

        const data = await response.json();

        const message =
            document.getElementById("borrowMessage");

        if (!response.ok) {

            message.innerHTML =
                `<span style="color:red">${data.error}</span>`;

            return;
        }

        message.innerHTML = `
            <span style="color:green">
                Borrowed successfully!
                Unit ${data.unit_code}.
                Due ${data.due_date}.
                Deposit ₹${data.deposit}.
            </span>
        `;

        loadEquipment();
        loadLoans();
    });


async function returnLoan(id) {

    const response = await fetch(
        `/api/loans/${id}/return`,
        {
            method: "POST"
        }
    );

    const data = await response.json();

    if (!response.ok) {

        alert(data.error);

        return;
    }

    alert(`
Return successful!

Late days: ${data.late_days}
Late fee: ₹${data.late_fee}
Deposit refunded: ₹${data.deposit_refunded}
    `);

    loadEquipment();
    loadLoans();
}


async function transferLoan(id) {

    const borrowerId = document.getElementById(`transfer-${id}`).value;

    if (!borrowerId) {
        alert("Select a new borrower first.");
        return;
    }

    const response = await fetch(`/api/loans/${id}/transfer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ borrower_id: borrowerId })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.error);
        return;
    }

    alert(`Loan transferred successfully. Due date remains ${data.due_date}.`);
    loadLoans();
}


async function initializeDashboard() {
    await Promise.all([
        loadEquipment(),
        loadBorrowers()
    ]);

    await loadLoans();
}


initializeDashboard();