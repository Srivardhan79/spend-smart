export class ExpenseManager {
  constructor() {
    this.expenses = [];
    this.budget = 0;
    this.loadData();
  }
  loadData() {
    try {
      const savedExpenses = JSON.parse(localStorage.getItem("spendsmartExpenses")) || [];
      const savedBudget = Number(localStorage.getItem("spendsmartBudget")) || 0;
      if (Array.isArray(savedExpenses)) {
        this.expenses = savedExpenses.filter((expense) => this.isValidExpense(expense));
      }
      this.budget = savedBudget >= 0 ? savedBudget : 0;
    } catch (error) {
      console.log("Could not load saved data:", error);
      this.expenses = [];
      this.budget = 0;
    }
  }
  saveData() {
    localStorage.setItem("spendsmartExpenses", JSON.stringify(this.expenses));
    localStorage.setItem("spendsmartBudget", String(this.budget));
  }
  isValidExpense(expense) {
    const categories = ["Food", "Travel", "Shopping", "Other"];
    return expense &&
      typeof expense.id === "string" &&
      typeof expense.name === "string" &&
      expense.name.trim() !== "" &&
      Number.isFinite(Number(expense.amount)) &&
      Number(expense.amount) > 0 &&
      categories.includes(expense.category) &&
      typeof expense.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(expense.date) &&
      !Number.isNaN(new Date(expense.date + "T00:00:00").getTime());
  }
  addExpense(name, amount, category, date) {
    const expense = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      name: name.trim(),
      amount: Number(amount),
      category: category,
      date: date
    };
    if (!this.isValidExpense(expense)) {
      throw new Error("Please enter a valid name, amount, category, and date.");
    }
    this.expenses.push(expense);
    this.saveData();
  }
  deleteExpense(id) {
    this.expenses = this.expenses.filter((expense) => expense.id !== id);
    this.saveData();
  }
  setBudget(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Budget must be zero or more.");
    }
    this.budget = value;
    this.saveData();
  }
  getCurrentMonthExpenses() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return this.expenses.filter((expense) => {
      const date = new Date(expense.date + "T00:00:00");
      return date.getMonth() === month && date.getFullYear() === year;
    });
  }
  getMonthlyTotal() {
    return this.getCurrentMonthExpenses().reduce((total, expense) => {
      return total + Number(expense.amount);
    }, 0);
  }
  importExpenses(newExpenses) {
    if (!Array.isArray(newExpenses) || !newExpenses.every((item) => this.isValidExpense(item))) {
      throw new Error("The JSON file has an invalid format.");
    }
    this.expenses = newExpenses;
    this.saveData();
  }
  clearExpenses() {
    this.expenses = [];
    this.saveData(); 
  }
}