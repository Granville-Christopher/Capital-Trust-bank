// const btnInternational = document.getElementById("btnInternational");
// const btnLocal = document.getElementById("btnLocal");
// const internationalSection = document.getElementById("internationalSection");
// const localSection = document.getElementById("localSection");
const statementModal = document.getElementById("statementModal");
// const downloadInternational = document.getElementById("downloadInternational");
const downloadLocal = document.getElementById("downloadLocal");

// window.addEventListener("DOMContentLoaded", () => {
//   showSection("local");
// });

// btnInternational.addEventListener("click", () => {
//   showSection("international");
// });

// btnLocal.addEventListener("click", () => {
//   showSection("local");
// });

// downloadInternational.addEventListener("click", () => {
//   openModal("international");
// });

downloadLocal.addEventListener("click", () => {
  openModal("local");
});

// function showSection(section) {
//   if (section === "international") {
//     internationalSection.classList.remove("hidden");
//     localSection.classList.add("hidden");
//     btnInternational.classList.add("text-blue-600", "border-blue-600");
//     btnInternational.classList.remove("text-gray-600", "border-transparent");
//     btnLocal.classList.add("text-gray-600", "border-transparent");
//     btnLocal.classList.remove("text-blue-600", "border-blue-600");
//   } else {
//     localSection.classList.remove("hidden");
//     internationalSection.classList.add("hidden");
//     btnLocal.classList.add("text-blue-600", "border-blue-600");
//     btnLocal.classList.remove("text-gray-600", "border-transparent");
//     btnInternational.classList.add("text-gray-600", "border-transparent");
//     btnInternational.classList.remove("text-blue-600", "border-blue-600");
//   }
// }

function openModal(section) {
  statementModal.classList.remove("hidden");
  const modalTitle = statementModal.querySelector("h3");
  if (section === "international") {
    modalTitle.textContent = "Download International Transaction Statement";
  } else {
    modalTitle.textContent = "Download Local Transaction Statement";
  }
}

function closeModal() {
  statementModal.classList.add("hidden");
}
