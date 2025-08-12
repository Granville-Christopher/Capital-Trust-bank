const btnSavings = document.getElementById("btnSavings");
const btnLoans = document.getElementById("btnLoans");
const savingsSection = document.getElementById("savingsHistorySection");
const loanSection = document.getElementById("loanHistorySection");

btnSavings.addEventListener("click", () => {
  btnSavings.classList.add("border-b-blue-600", "text-blue-600");
  btnLoans.classList.remove("border-b-blue-600", "text-blue-600");
  btnLoans.classList.add("text-gray-600", "border-transparent");
  savingsSection.classList.remove("hidden");
  loanSection.classList.add("hidden");
});

btnLoans.addEventListener("click", () => {
  btnLoans.classList.add("border-b-blue-600", "text-blue-600");
  btnSavings.classList.remove("border-b-blue-600", "text-blue-600");
  btnSavings.classList.add("text-gray-600", "border-transparent");
  loanSection.classList.remove("hidden");
  savingsSection.classList.add("hidden");
});

function downloadCSV(tableId, filename) {
  const rows = Array.from(document.querySelectorAll(`#${tableId} tr`));
  let csvContent = "";
  rows.forEach((row) => {
    let cols = Array.from(row.querySelectorAll("th, td")).map(
      (cell) => `"${cell.innerText.replace(/"/g, '""')}"`
    );
    csvContent += cols.join(",") + "\n";
  });
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

document
  .getElementById("downloadSavingsHistory")
  .addEventListener("click", () => {
    downloadCSV("savingsTable", "Savings_History.csv");
  });

document.getElementById("downloadLoanHistory").addEventListener("click", () => {
  downloadCSV("loanTable", "Loan_History.csv");
});

const scrollBtn = document.createElement("button");
scrollBtn.innerHTML = "⬆";
scrollBtn.className =
  "fixed bottom-16 right-5 bg-blue-600 text-white p-3 rounded-full shadow-md hidden";
document.body.appendChild(scrollBtn);

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    scrollBtn.classList.remove("hidden");
    scrollBtn.classList.add("mb-20");
  } else {
    scrollBtn.classList.add("hidden");
  }
});

scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

let currentSkipSavings = 100;
let currentSkipLoans = 100;
let loading = false;

async function fetchMoreHistory() {
  if (loading) return;
  loading = true;

  const activeSection = !savingsSection.classList.contains("hidden")
    ? "savings"
    : "loans";
  const skip =
    activeSection === "savings" ? currentSkipSavings : currentSkipLoans;

  try {
    const res = await fetch(
      `/udp/financehistory/load?type=${activeSection}&skip=${skip}`
    );
    if (!res.ok) throw new Error("Server error while loading more history");

    const { success, data } = await res.json();
    if (!success || !data || data.length === 0) {
      console.log("✅ No more records to load.");
      observer.disconnect();
      return;
    }

    const tableBody =
      activeSection === "savings"
        ? document.querySelector("#savingsHistorySection tbody")
        : document.querySelector("#loanHistorySection tbody");

    data.forEach((item) => {
      const tr = document.createElement("tr");
      tr.classList.add("border-b");

      if (activeSection === "savings") {
        tr.innerHTML = `
                        <td class="py-2 px-4">${new Date(
                          item.createdAt
                        ).toLocaleDateString()}</td>
                        <td class="py-2 px-4 capitalize ${
                          item.type === "deposit"
                            ? "text-green-600"
                            : item.type === "withdraw_interest"
                            ? "text-red-600"
                            : item.type === "compound_interest"
                            ? "text-blue-600"
                            : "text-gray-600"
                        }">
                            ${item.type.replace("_", " ")}
                        </td>
                        <td class="py-2 px-4 font-semibold ${
                          item.type === "deposit"
                            ? "text-green-600"
                            : item.type === "withdraw_interest"
                            ? "text-red-600"
                            : ""
                        }">
                            $${(item.amount || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </td>
                        <td class="py-2 px-4 text-blue-600 font-semibold">
                            $${(item.balanceAfter || 0).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                        </td>
                        <td class="py-2 px-4 text-gray-600">
                            ${item.referenceId || "N/A"}
                        </td>
                    `;
      } else {
        tr.innerHTML = `
                        <td class="py-2 px-4">${new Date(
                          item.createdAt
                        ).toLocaleDateString()}</td>
                        <td class="py-2 px-4 capitalize">${item.reason}</td>
                        <td class="py-2 px-4 text-red-600 font-semibold">
                            $${(item.amount || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </td>
                        <td class="py-2 px-4 capitalize ${
                          item.action === "approved" || item.action === "repaid"
                            ? "text-green-600"
                            : item.action === "rejected"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }">
                            ${item.action}
                        </td>
                        <td class="py-2 px-4 text-gray-600 whitespace-nowrap">
                            ${item.statusNote || "No additional note"}
                        </td>
                    `;
      }

      tableBody.appendChild(tr);
    });

    if (activeSection === "savings") {
      currentSkipSavings += data.length;
    } else {
      currentSkipLoans += data.length;
    }
  } catch (err) {
    console.error("❌ Error fetching more:", err);
  } finally {
    loading = false;
  }
}

const sentinel = document.createElement("div");
sentinel.id = "scrollSentinel";
sentinel.className = "h-10";
document.body.appendChild(sentinel);

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    fetchMoreHistory();
  }
});

observer.observe(sentinel);
