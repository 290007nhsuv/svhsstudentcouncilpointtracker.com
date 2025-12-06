// The public CSV URL from your Google Sheet
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTrxs74JzVjgKbg_JTPLV5YHCG_w4HiRZPx0MclFHofOhwW7O81ygswCE_Aqn8qm_bVuSEgL8DqvabI/pub?gid=0&single=true&output=csv';

let studentData = [];

// Column indices based on the provided image/CSV structure (0-indexed)
// 0: id, 1: Name, 2: Points Percentage, 3: Person's Total Points, 4: Total Points, etc.
const COLUMN_ID = 0;
const COLUMN_NAME = 1;
const COLUMN_PERCENTAGE = 2;
const COLUMN_PERSON_POINTS = 3;
// We don't need the other column indices for this simplified output

/**
 * Fetches the CSV data and parses it into an array of student objects.
 */
async function loadData() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        
        // Simple CSV parsing (splits by newline, then by comma)
        const rows = csvText.trim().split('\n');
        
        // Skip header row (row 0) and the second row of the image (row 1)
        const dataRows = rows.slice(2); 

        studentData = dataRows.map(row => {
            const columns = row.split(',');
            
            // Basic check to ensure the row has enough columns
            if (columns.length > COLUMN_PERSON_POINTS) {
                return {
                    id: columns[COLUMN_ID].trim(),
                    name: columns[COLUMN_NAME].trim(),
                    percentage: columns[COLUMN_PERCENTAGE].trim(),
                    personPoints: columns[COLUMN_PERSON_POINTS].trim(),
                };
            }
            return null;
        }).filter(item => item !== null && item.id && item.name); // Filter out invalid/empty rows

        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
        console.log(`Data loaded successfully. ${studentData.length} records found.`);

    } catch (error) {
        console.error('Error loading or parsing data:', error);
        document.getElementById('results').innerHTML = '<p style="color:red;">❌ Error loading data. Please check the CSV link or try again later.</p>';
    }
}

/**
 * Searches the loaded data for a matching student and displays the result.
 */
function searchPoints() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim().toLowerCase();
    const resultsDiv = document.getElementById('results');

    if (!searchTerm) {
        resultsDiv.innerHTML = '<p>Please enter a **Name** or **ID Number** to search.</p>';
        return;
    }

    // Try to find a match by ID or by name (case-insensitive, partial match)
    const foundStudent = studentData.find(student => 
        student.id === searchTerm || 
        student.name.toLowerCase().includes(searchTerm)
    );

    if (foundStudent) {
        displayResult(foundStudent, resultsDiv);
    } else {
        resultsDiv.innerHTML = `<p>⚠️ No student found matching "**${searchInput.value}**". Please try again.</p>`;
    }
}

/**
 * Creates and inserts the HTML for the student's point details.
 * *** MODIFIED FOR SIMPLIFIED OUTPUT ***
 */
function displayResult(student, resultsDiv) {
    // Determine the color class for the percentage
    let percentageClass = '';
    const percentageValue = parseFloat(student.percentage); 

    if (percentageValue >= 100) {
        percentageClass = 'high';
    } else if (percentageValue < 75) {
        percentageClass = 'low';
    }

    // Build the SIMPLIFIED results HTML
    resultsDiv.innerHTML = `
        <div class="student-card">
            <h2>${student.name} (${student.id})</h2>
            <p><strong>Overall Point Percentage:</strong> <span class="points-percentage ${percentageClass}">${student.percentage}</span></p>
            <p><strong>Points Earned:</strong> ${student.personPoints}</p>
        </div>
    `;
}

// Attach event listener for pressing 'Enter' in the search box
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchPoints();
    }
});

// Load data when the script starts
loadData();
