const dbName = "CostManagerDB";
let db;

// Open IndexedDB Database
export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains("costs")) {
                db.createObjectStore("costs", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = () => reject("Error opening database.");
    });
}



// Add Expense to IndexedDB
export function addExpense(expense) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("costs", "readwrite");
        const store = transaction.objectStore("costs");
        const request = store.add(expense);
        request.onsuccess = async () => {
            resolve("Expense added successfully!");
        };

        request.onerror = () => reject("Failed to add expense.");
    });
}



// Get Records by Month and Year
export function getRecordsByMonthAndYear(month, year) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("costs", "readonly");
        const store = transaction.objectStore("costs");
        const request = store.getAll();

        request.onsuccess = () => {

            // סינון ההוצאות לפי חודש ושנה
            const expenses = request.result.filter((expense) => {
                if (!expense.date) return false; // לוודא שיש ערך לתאריך
                const [expenseDay, expenseMonth, expenseYear] = expense.date.split('/').map(Number);

                // השוואה בין חודש ושנה
                return expenseMonth === month && expenseYear === year;
            });

            // אם ההשוואה הצליחה והתוצאות הוחזרו
            if (expenses.length <= 0) {
                alert("No expenses found for the given month and year.");
            }
            console.log(expenses);
            resolve(expenses);
        };

        request.onerror = (event) => {
            console.error("Error fetching records:", event.target.error);
            alert("Failed to fetch expenses.");
            reject("Failed to fetch expenses.");
        };
    });
}


//-----------------------------------------------------------------------
export async function checkIfLimit(expense) {
    const limit = parseFloat(document.getElementById("limit").value); // Convert to a number
    if (isNaN(limit) || limit <= 0) {
        console.error("Invalid limit value. Please enter a valid number.");
        return;
    }
    expense.sum = parseInt(document.getElementById("sum").value);
    try {
        const [expenseDay, expenseMonth, expenseYear] = expense.date.split('/').map(Number);
        const expenses = await getRecordsByMonthAndYear(expenseMonth, expenseYear);
        console.log(expenses);
        // Calculate total monthly sum
        let totalMonthlySum = 0;
        for (const expense of expenses) {
            totalMonthlySum += expense.sum;
        }

        // Check if the limit is reached or exceeded
        if (totalMonthlySum >= limit) {
            alert("Notice! You have reached your limit.");
        }
    }
    catch (error) {
        console.error("Error fetching expenses:", error);
    }
}




// Generate Pie Chart
export async function updatePieChart(expenses) {
    const categorySummary = {};
    expenses.forEach((expense) => {
        categorySummary[expense.category] =
            (categorySummary[expense.category] || 0) + expense.sum;
    });

    const categories = Object.keys(categorySummary);
    const values = Object.values(categorySummary);

    if (window.myChart) {
        await window.myChart.destroy();
    }

    const ctx = document.getElementById("expensesChart").getContext("2d");
    window.myChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: categories,
            datasets: [{ data: values }],
        },
    });
}



export async function removeExpense(expenseId)
{
    if (!db) {
        throw new Error("Database is not initialized.");
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("costs", "readwrite");
        const store = transaction.objectStore("costs");
        const getRequest = store.get(expenseId);// first see if id exist
        getRequest.onsuccess = () => {
            if (!getRequest.result) {
                alert(`Expense with ID ${expenseId} not found.`);
                reject(new Error(`Expense with ID ${expenseId} not found.`));
                return;
            }

            // If the ID exists, proceed
            const deleteRequest = store.delete(expenseId);

            deleteRequest.onsuccess = () => {
                resolve();
            };

            deleteRequest.onerror = (event) => {
                reject(event.target.error);
            };
        };

        getRequest.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

