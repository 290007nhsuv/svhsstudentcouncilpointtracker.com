// The public CSV URL from your Google Sheet
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTrxs74JzVjgKbg_JTPLV5YHCG_w4HiRZPx0MclFHofOhwW7O81ygswCE_Aqn8qm_bVuSEgL8DqvabI/pub?gid=0&single=true&output=csv';

let studentData = [];

// Column indices based on the provided image/CSV structure (0-indexed)
// NOTE: We are intentionally shifting the data retrieval based on user feedback
// COLUMN_ID (0) and COLUMN_NAME (1) remain the same.

// Mapped to "Total Points Available" column (index 4 in the sheet structure)
const COLUMN_PERCENTAGE_MAPPED = 4; 
// Mapped to "Concessions" column (index 5 in the sheet structure)
const COLUMN_POINTS_EARNED_MAPPED = 5; 

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
        
        const rows = csvText.trim().split('\n');
        
        // Skip header row (row 0) and the second row of the image (row 1)
        const dataRows = rows.slice(2); 

        studentData = dataRows.map(row => {
            const columns = row.split(',');
            
            // Ensure we have enough columns to safely access the mapped indices
            if (columns.length > COLUMN_POINTS_EARNED_MAPPED) {
                return {
                    id: columns[0].trim(),
                    name: columns[1].trim(),
                    // Retrieve from the Total Points Available column (index 4)
                    percentage: columns[COLUMN_PERCENTAGE_MAPPED].trim(), 
                    // Retrieve from the Concessions column (index 5)
                    personPoints: columns[COLUMN_POINTS_EARNED_MAPPED].trim(),
                };
            }
            return null;
        }).filter(item => item !== null && item.id && item.name);

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
 */
function displayResult(student, resultsDiv) {
    
    // Use the values as stored from the mapped columns
    const percentage = student.percentage || 'N/A';
    const personPoints = student.personPoints || 'N/A';
    
    // Determine the color class for the percentage (only if it's a valid number)
    let percentageClass = '';

    if (!isNaN(parseFloat(percentage))) {
        const percentageValue = parseFloat(percentage); 
        if (percentageValue >= 100) {
            percentageClass = 'high';
        } else if (percentageValue < 75) {
            percentageClass = 'low';
        }
    }

    // Build the results HTML
    resultsDiv.innerHTML = `
        <div class="student-card">
            <h2>${student.name} (${student.id})</h2>
            <p><strong>Overall Point Percentage:</strong> <span class="points-percentage ${percentageClass}">${percentage}</span></p>
            <p><strong>Points Earned:</strong> ${personPoints}</p>
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
