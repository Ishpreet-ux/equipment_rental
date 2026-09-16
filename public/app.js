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
    const borrowers = await response.json();

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

                <button onclick="returnLoan(${loan.id})">
                    Return
                </button>

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


loadEquipment();
loadBorrowers();
loadLoans();