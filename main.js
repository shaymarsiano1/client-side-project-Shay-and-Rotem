// main.js
import {openDatabase, addExpense, checkIfLimit, getRecordsByMonthAndYear, updatePieChart, removeExpense} from './indexedDBLibrary.js';

let db;

// Open Database
openDatabase().then((database) => {
    db = database;
}).catch((error) => {
    console.error("Error initializing database:", error);
});

// Add Expense Form Handler
document.getElementById("expense-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const sum = parseFloat(document.getElementById("sum").value);
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const dateInput = document.getElementById("dateOfExpense").value;
    if (!dateInput) {
        alert("Please select a valid date.");
        return;
    }
    const [year, month, day] = dateInput.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    const expense = { sum, category, description, date: formattedDate };

    try {
        await addExpense(expense);
        alert("Expense added successfully!");
        document.getElementById("expense-form").reset();
        await checkIfLimit(expense);
    } catch (error) {
        console.error("Error adding expense:", error);
        alert("Failed to add expense. Please try again.");
    }
});

// Generate Report
document.getElementById("generateReportBtn").addEventListener("click", async () => {
    const month = parseInt(document.getElementById("month").value);
    const year = parseInt(document.getElementById("year").value);

    try {
        const expenses = await getRecordsByMonthAndYear(month, year);
        displayReport(expenses);
        await updatePieChart(expenses);
    } catch (error) {
        console.error(error);
        alert("Error generating report.");
    }
});

// Display Report Function
function displayReport(expenses) {
    const reportList = document.getElementById("reportList");
    reportList.innerHTML = "";

    expenses.forEach((expense) => {
        const listItem = document.createElement("li");
        listItem.textContent = `ID: ${expense.id}, ${expense.date}: ${expense.category} - ${expense.sum} ₪ (${expense.description})`;
        listItem.setAttribute("data-id", expense.id); // Add data-id for future use
        reportList.appendChild(listItem);
    });
}

// Clear Button
document.getElementById("clearButton").addEventListener("click", async() => {
    if (window.myChart) {
        await window.myChart.destroy();
    }
    document.getElementById("reportList").innerHTML = '';
    document.getElementById("month").value = '';
    document.getElementById("year").value = '';
});


// remove button
document.getElementById("deleteBtn").addEventListener("click", async () => {
    const id = parseInt(document.getElementById("removeBtn").value);
    document.getElementById("removeBtn").value = "for example: 8";

    if (isNaN(id))
    {
        alert("Please enter a valid ID.");
        return;
    }
    try
    {
        await removeExpense(id);
        alert(`Expense with ID ${id} removed successfully.`);
    }
    catch (error)
    {
        console.error("Error removing expense:", error);
    }
});
