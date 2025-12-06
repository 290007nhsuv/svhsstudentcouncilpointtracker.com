// --- Global Constants ---
const SHEET_PUBLIC_KEY = '2PACX-1vTrxs74JzVjgKbg_JTPLV5YHCG_w4HiRZPx0MclFHofOhwW7O81ygswCE_Aqn8qm_bVuSEgL8DqvabI';

let dataSet = []; // Array to hold the parsed sheet data
let isLoading = false;

// --- CSV Parsing Function (CONFIRMED COLUMN ORDER FIX) ---
// Assumes sheet columns are: ID (0), Name (1), Percentage (2), Points (3)...
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const data = [];
    
    // Start from line 1 to skip the header
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        // Ensure we have at least 4 columns
        if (values.length >= 4) { 
            // FIXED MAPPING based on your sheet: ID (0), Name (1), Percentage (2), Points (3)
            const entry = {
                ID: values[0].trim().replace(/"/g, ''),          
                Name: values[1].trim().replace(/"/g, ''),        
                Percentage: values[2].trim().replace(/"/g, ''),  
                Points: values[3].trim().replace(/"/g, '')       
            };
            data.push(entry);
        }
    }
    return data;
}

// --- Data Fetching Function (MODIFIED for Semester Selection) ---
async function fetchSheetData(gid) {
    if (isLoading) return; // Prevent concurrent fetches
    isLoading = true;
    
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const searchButton = document.getElementById('searchButton');

    // CONSTRUCT URL with the selected GID and CRITICAL FIX parameter: &single=true
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_PUBLIC_KEY}/pub?gid=${gid}&single=true&output=csv`;

    loadingMessage.textContent = 'Loading data... Please wait.';
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    searchButton.disabled = true;

    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        dataSet = parseCSV(csvText);
        
        loadingMessage.style.display = 'none'; 
        searchButton.disabled = false;
        
    } catch (error) {
        console.error("Could not fetch or parse sheet data:", error);
        loadingMessage.style.display = 'none';
        errorMessage.textContent = 'ERROR: Could not load data. Ensure the sheet is clean (no errors/merged cells) and published correctly.';
        errorMessage.style.display = 'block';
        dataSet = []; // Clear data on error
    } finally {
        isLoading = false;
    }
}

// --- Search Function (REVISED for robust trimming) ---
function searchData() {
    const inputElement = document.getElementById('searchInput');
    const resultsArea = document.getElementById('resultsArea');
    
    // Aggressively trim and lowercase the user's input
    const searchTerm = inputElement.value.trim().toLowerCase(); 
    
    if (searchTerm === "") {
        resultsArea.innerHTML = '<p class="initial-prompt">Please enter a Name or Number to search.</p>';
        return;
    }

    // Search against dataSet, ensuring item fields are also trimmed and lowercased 
    const foundEntry = dataSet.find(item => 
        item.Name.trim().toLowerCase() === searchTerm || 
        item.ID.trim().toLowerCase() === searchTerm
    );

    resultsArea.innerHTML = ''; // Clear previous results

    if (foundEntry) {
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
        resultsArea.innerHTML = `
            <div class="message error-message">
                No entry found for **"${inputElement.value}"**. Please check the name or number and try again.
            </div>
        `;
    }
}

// --- Initialization (MODIFIED to handle dropdown) ---
document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('semesterSelector');

    // 1. Attach Search Event Listeners
    document.getElementById('searchButton').addEventListener('click', searchData);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchData();
        }
    });

    // 2. Attach Dropdown Change Listener: fetches new data when a semester is selected
    selector.addEventListener('change', (event) => {
        // Fetch data for the newly selected GID (event.target.value)
        fetchSheetData(event.target.value); 
        // Clear previous search results when data set changes
        document.getElementById('resultsArea').innerHTML = '<p class="initial-prompt">Data loaded. Enter a name or number and click Search.</p>';
    });

    // 3. Initial Load: Fetch data for the default selection (Semester 1 GID)
    fetchSheetData(selector.value);
});
