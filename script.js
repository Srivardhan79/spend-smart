import { ExpenseManager } from "./expenseManager.js";
const manager = new ExpenseManager();
const expenseForm = document.getElementById("expenseForm");
const budgetForm = document.getElementById("budgetForm");
const nameInput = document.getElementById("name");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const budgetInput = document.getElementById("budget");
const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filterCategory");
const expenseRows = document.getElementById("expenseRows");
const emptyMessage = document.getElementById("emptyMessage");
let newestFirst = true;
dateInput.value = new Date().toLocaleDateString("en-CA");
budgetInput.value = manager.budget;
function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(amount);
}
function updateDashboard() {
  const monthlyExpenses = manager.getCurrentMonthExpenses();
  const total = manager.getMonthlyTotal();
  const remaining = manager.budget - total;
  document.getElementById("total").textContent = money(total);
  document.getElementById("count").textContent = monthlyExpenses.length;
  document.getElementById("remaining").textContent = money(remaining);
  const warning = document.getElementById("warning");
  if (total > manager.budget && manager.budget > 0) {
    warning.hidden = false;
    warning.textContent = "Warning: You have exceeded your monthly budget!";
  } else {
    warning.hidden = true;
  }
}
function showExpenses() {
  const searchText = searchInput.value.toLowerCase().trim();
  const chosenCategory = filterCategory.value;
  let visibleExpenses = manager.expenses.filter((expense) => {
    const matchesName = expense.name.toLowerCase().includes(searchText);
    const matchesCategory = chosenCategory === "All" || expense.category === chosenCategory;
    return matchesName && matchesCategory;
  });
  visibleExpenses.sort((a, b) => {
    return newestFirst ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
  });
  expenseRows.innerHTML = "";
  for (const expense of visibleExpenses) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = expense.name;
    const amountCell = document.createElement("td");
    amountCell.textContent = money(Number(expense.amount));
    const categoryCell = document.createElement("td");
    categoryCell.textContent = expense.category;
    const dateCell = document.createElement("td");
    dateCell.textContent = expense.date;
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => {
      if (confirm("Delete this expense?")) {
        manager.deleteExpense(expense.id);
        showExpenses();
        updateDashboard();
      }
    });
    actionCell.appendChild(deleteButton);
    row.append(nameCell, amountCell, categoryCell, dateCell, actionCell);
    expenseRows.appendChild(row);
  }
  emptyMessage.hidden = visibleExpenses.length > 0;
}
expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    manager.addExpense(
      nameInput.value,
      amountInput.value,
      categoryInput.value,
      dateInput.value
    );
    expenseForm.reset();
    dateInput.value = new Date().toLocaleDateString("en-CA");
    showExpenses();
    updateDashboard();
  } catch (error) {
    alert(error.message);
  }
});
budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    manager.setBudget(budgetInput.value);
    updateDashboard();
    alert("Monthly budget saved.");
  } catch (error) {
    alert(error.message);
  }
});
searchInput.addEventListener("input", showExpenses);
filterCategory.addEventListener("change", showExpenses);
document.getElementById("sortButton").addEventListener("click", (event) => {
  newestFirst = !newestFirst;
  event.target.textContent = newestFirst ? "Sort by date: newest" : "Sort by date: oldest";
  showExpenses();
});
document.getElementById("clearButton").addEventListener("click", () => {
  if (confirm("Delete ALL expenses? Your budget will be kept.")) {
    manager.clearExpenses();
    showExpenses();
    updateDashboard();
  }
});
document.getElementById("exportButton").addEventListener("click", () => {
  const data = JSON.stringify(manager.expenses, null, 2);
  const file = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "spendsmart-expenses.json";
  link.click();
  URL.revokeObjectURL(url);
});
document.getElementById("importFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!confirm("Importing will replace your current expenses. Continue?")) {
    event.target.value = "";
    return;
  }
  try {
    const text = await file.text(); // file.text() returns a Promise.
    const importedData = JSON.parse(text);
    manager.importExpenses(importedData);
    showExpenses();
    updateDashboard();
    alert("Expenses imported successfully.");
  } catch (error) {
    alert("Import failed: " + error.message);
  } finally {
    event.target.value = "";
  }
});
document.getElementById("convertButton").addEventListener("click", async () => {
  const result = document.getElementById("conversionResult");
  result.textContent = "Loading exchange rate...";
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/INR");
    if (!response.ok) throw new Error("Could not get exchange rate.");
    const data = await response.json();
    const rate = data.rates.USD;
    if (!rate) throw new Error("USD rate was not available.");
    const usd = manager.getMonthlyTotal() * rate;
    result.textContent = money(manager.getMonthlyTotal()) + " is approximately $" + usd.toFixed(2) + " USD.";
  } catch (error) {
    result.textContent = "Conversion failed. Check your internet connection and try again.";
  }
});
showExpenses();
updateDashboard();