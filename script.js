// The modified URL to fetch the raw CSV data from your published Google Sheet.
// I have uncommented and used the correct GID (Sheet ID) for your specific tab.
const SHEET_PUBLIC_KEY = '2PACX-1vTrxs74JzVjgKbg_JTPLV5YHCG_w4HiRZPx0MclFHofOhwW7O81ygswCE_Aqn8qm_bVuSEgL8DqvabI';
const SHEET_GID = '244391946'; // The #gid= part of your link
// CORRECTED URL: Includes the GID and single=true to ensure only one tab is downloaded
const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_PUBLIC_KEY}/pub?gid=${SHEET_GID}&single=true&output=csv`;

let dataSet = []; // Array to hold the parsed sheet data

// --- CSV Parsing Function (FIXED COLUMN ORDER) ---
// Now assumes sheet columns are in this order: ID, Name, Points Percentage, Points...
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // The first line is the header, skip it and start parsing from line 1
    const data = [];
    
    // NOTE: This basic parsing is simple but fragile if your data contains commas or quotes.
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        // We only need the first 4 columns for the search/display
        if (values.length >= 4) { 
            // FIXED: Values are mapped based on your sheet order: ID (0), Name (1), Percentage (2), Points (3)
            const entry = {
                ID: values[0].trim().replace(/"/g, ''),          // Index 0: ID
                Name: values[1].trim().replace(/"/g, ''),        // Index 1: Name
                Percentage: values[2].trim().replace(/"/g, ''),  // Index 2: Points Percentage
                Points: values[3].trim().replace(/"/g, '')       // Index 3: Points
            };
            data.push(entry);
        }
    }
    return data;
}

// --- Data Fetching Function (UNCHANGED) ---
async function fetchSheetData() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        dataSet = parseCSV(csvText);
        
        loadingMessage.style.display = 'none'; // Hide loading
        errorMessage.style.display = 'none'; // Clear any previous error
        
        // Enable the search button once data is loaded
        document.getElementById('searchButton').disabled = false;
        
    } catch (error) {
        console.error("Could not fetch or parse sheet data:", error);
        loadingMessage.style.display = 'none';
        errorMessage.textContent = 'ERROR: Could not load data from Google Sheet. Check the Sheet\'s "Publish to the web" settings and ensure CORS is allowed.';
        errorMessage.style.display = 'block';
    }
}

// --- Search Function (UNCHANGED) ---
function searchData() {
    const inputElement = document.getElementById('searchInput');
    const resultsArea = document.getElementById('resultsArea');
    
    const searchTerm = inputElement.value.trim().toLowerCase(); 
    
    if (searchTerm === "") {
        resultsArea.innerHTML = '<p class="initial-prompt">Please enter a Name or Number to search.</p>';
        return;
    }

    resultsArea.innerHTML = ''; // Clear previous results
    
    const foundEntry = dataSet.find(item => 
        // Ensure that the item data is also trimmed/lowercased just before comparison
        item.Name.trim().toLowerCase() === searchTerm || 
        item.ID.trim().toLowerCase() === searchTerm
    );

    if (foundEntry) {
        // Display the results neatly
        resultsArea.innerHTML = `
            <div class="result-item">
                <span class="result-label">Name:</span> ${foundEntry.Name}
            </div>
            <div class="result-item">
                <span class="result-label">ID/Number:</span> ${foundEntry.ID}
            </div>
            <div class="result-item">
                <span class="result-label">Points:</span> <strong>${foundEntry.Points}</strong>
            </div>
            <div class="result-item">
                <span class="result-label">Percentage:</span> <strong>${foundEntry.Percentage}</strong>
            </div>
        `;
    } else {
        // Display not found message
        resultsArea.innerHTML = `
            <div class="message error-message">
                No entry found for **"${inputElement.value}"**. Please check the name or number and try again.
            </div>
        `;
    }
}

// --- Initialization (UNCHANGED) ---
document.addEventListener('DOMContentLoaded', () => {
    // Disable button until data is loaded
    document.getElementById('searchButton').disabled = true; 
    
    // Attach event listeners
    document.getElementById('searchButton').addEventListener('click', searchData);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchData();
        }
    });

    // Start fetching data immediately
    fetchSheetData();
});
