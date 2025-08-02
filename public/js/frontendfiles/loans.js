document.addEventListener("DOMContentLoaded", () => {
  const loanContainer = document.getElementById("loanContainer");

  async function fetchLoans() {
    try {
      const res = await fetch("/user/secure/ctb/loans");
      const data = await res.json();

      if (!res.ok) {
        return alert(data.error || "Error loading loans");
      }

      loanContainer.innerHTML = "";

      if (data.loans.length === 0) {
        loanContainer.innerHTML = `<p class="text-gray-600">No loan history found.</p>`;
        return;
      }

      data.loans.forEach((loan) => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-xl shadow p-4 relative";

        card.innerHTML = `
          <div class="flex justify-between items-center mb-2">
            <p class="text-lg font-semibold">Loan: $${loan.amount}</p>
            <span class="text-xs px-2 py-1 rounded ${
              loan.status === "approved"
                ? "bg-green-200 text-green-800"
                : loan.status === "pending"
                ? "bg-yellow-200 text-yellow-800"
                : "bg-gray-200 text-gray-700"
            }">${loan.status}</span>
          </div>

          <p class="text-sm text-gray-600">Interest: $${loan.interest}</p>
          <p class="text-sm text-gray-600">Reason: ${loan.reason}</p>
          <p class="text-sm text-gray-600">Due: ${
            loan.dueDate
              ? new Date(loan.dueDate).toLocaleDateString()
              : "No due date"
          }</p>
          <p class="mt-2 text-red-600 font-semibold">Outstanding: $${
            loan.outstanding
          }</p>

          ${
            loan.status === "approved" && loan.outstanding > 0
              ? `<button class="mt-3 w-full py-2 bg-red-600 text-white rounded-full hover:bg-red-700 repayBtn" data-id="${loan.id}">
                   Repay Loan
                 </button>`
              : ""
          }
        `;

        loanContainer.appendChild(card);
      });

      document.querySelectorAll(".repayBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const loanId = e.target.dataset.id;
          const amount = prompt("Enter repayment amount:");

          if (!amount || isNaN(amount) || amount <= 0) {
            return alert("Enter a valid repayment amount.");
          }

          try {
            const repayRes = await fetch("/user/secure/ctb/repay-loan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ loanId, amount }),
            });

            const repayData = await repayRes.json();
            if (repayRes.ok) {
              alert(repayData.message);
              fetchLoans();
            } else {
              alert(repayData.error || "Repayment failed.");
            }
          } catch (err) {
            console.error(err);
            alert("Server error processing repayment");
          }
        });
      });
    } catch (err) {
      console.error("❌ Error fetching loans:", err);
      loanContainer.innerHTML = `<p class="text-red-600">Failed to load loans.</p>`;
    }
  }

  fetchLoans();
});
