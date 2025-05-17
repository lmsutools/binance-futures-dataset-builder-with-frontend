"use strict";
// Define a basic interface for the data records received from the backend
// This helps TypeScript understand the structure, even though it's simplified
// Although this is a JS file, the interface is commented out but kept for clarity on the expected data structure.
/*
interface FrontendBinanceRecord {
    // Records from the API will have either 'timestamp' or 'fundingTime'
    timestamp?: number;
    fundingTime?: number;
    // Allow other properties, as their names and types depend on the data type
    // Using a string index signature makes accessing properties by variable names safe
    [key: string]: any;
}
*/
document.addEventListener('DOMContentLoaded', () => {
    const dataTypeSelect = document.getElementById('dataType');
    const periodSelect = document.getElementById('period'); // Period select
    const dateRangeInputsDiv = document.getElementById('dateRangeInputs'); // Div containing date inputs
    const lastXInputsDiv = document.getElementById('lastXInputs'); // Div containing last X inputs
    const rangeTypeDateRadio = document.getElementById('rangeTypeDate'); // Date Range radio button
    const rangeTypeLastRadio = document.getElementById('rangeTypeLast'); // Last X radio button
    const lastXDurationSelect = document.getElementById('lastXDuration'); // Last X duration select
    const startDateInput = document.getElementById('startDate'); // Start Date input
    const endDateInput = document.getElementById('endDate'); // End Date input
    const fetchButton = document.getElementById('fetchButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsDiv = document.getElementById('results');
    const responseOutputDiv = document.getElementById('responseOutput');
    const periodInfoDiv = document.getElementById('periodInfo'); // Info text for period
    const dataInfoDiv = document.getElementById('dataInfo'); // Div for data info
    // Add checks for all required elements
    if (!dataTypeSelect || !periodSelect || !dateRangeInputsDiv || !lastXInputsDiv || !rangeTypeDateRadio || !rangeTypeLastRadio || !lastXDurationSelect || !startDateInput || !endDateInput || !fetchButton || !loadingIndicator || !resultsDiv || !responseOutputDiv || !periodInfoDiv || !dataInfoDiv) {
        console.error("Required DOM element(s) not found. Stopping script execution.");
        // Disable fetch button and show error message if critical elements are missing
        if (fetchButton) {
            fetchButton.disabled = true;
        }
        if (resultsDiv) {
            resultsDiv.innerHTML = '<p style="color: red;">Error initializing: Required page elements not found.</p>';
        }
        return; // Stop execution of this listener if critical elements are missing
    }
    // Populate period options (matching backend expectations where applicable)
    const periods = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d'];
    periodSelect.innerHTML = ''; // Clear existing options first
    periods.forEach(period => {
        const option = document.createElement('option');
        option.value = period;
        option.textContent = period;
        periodSelect.appendChild(option);
    });
    // Populate Last X duration options (mapping text to millisecond values)
    const lastXDurations = {
        '1h': 60 * 60 * 1000,
        '2h': 2 * 60 * 60 * 1000,
        '4h': 4 * 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '8h': 8 * 60 * 60 * 1000,
        '12h': 12 * 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '3d': 3 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '14d': 14 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
    };
    lastXDurationSelect.innerHTML = ''; // Clear existing options
    for (const [text, value] of Object.entries(lastXDurations)) {
        const option = document.createElement('option');
        option.value = text; // Use the text representation as the value
        option.textContent = text.replace('m', ' Minutes').replace('h', ' Hours').replace('d', ' Days'); // Make it more readable
        lastXDurationSelect.appendChild(option);
    }
    // Function to toggle between date range and last X inputs
    const toggleRangeInputs = (rangeType) => {
        if (rangeType === 'dateRange') {
            dateRangeInputsDiv.style.display = 'block';
            lastXInputsDiv.style.display = 'none';
            rangeTypeDateRadio.checked = true;
        }
        else { // lastX
            dateRangeInputsDiv.style.display = 'none';
            lastXInputsDiv.style.display = 'block';
            rangeTypeLastRadio.checked = true;
        }
        localStorage.setItem('selectedRangeType', rangeType); // Save preferred type
    };
    // Function to update the period select based on data type and load saved period
    const updatePeriodSelect = () => {
        const selectedDataType = dataTypeSelect.value;
        if (selectedDataType === 'fundingRate') {
            // Funding Rate is typically hourly and the Binance API endpoint doesn't support variable periods.
            // We disable the period select to reflect this API limitation.
            periodSelect.value = '1h'; // Set to 1h as it's the effective period
            periodSelect.disabled = true;
            periodInfoDiv.textContent = '(Funding Rate is typically hourly)';
        }
        else {
            // For other data types, period selection is enabled.
            periodSelect.disabled = false;
            periodInfoDiv.textContent = '(Available periods depend on Binance API for the selected data type)';
            // Attempt to restore saved period only if not disabled
            if (localStorage.getItem('selectedPeriod')) {
                const savedPeriod = localStorage.getItem('selectedPeriod');
                // Check if the saved period is actually one of the available options before setting
                if (savedPeriod && periods.includes(savedPeriod)) { // Use non-null assertion after check
                    periodSelect.value = savedPeriod;
                }
                else {
                    periodSelect.value = '5m'; // Default if saved period is not valid for available options
                }
            }
            else {
                // If not disabled and no saved period, default to 5m
                periodSelect.value = '5m';
            }
        }
    };
    // Set default dates (e.g., last 7 days) or load from localStorage
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const formatDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    // Load settings from localStorage
    const savedDataType = localStorage.getItem('selectedDataType');
    const savedRangeType = localStorage.getItem('selectedRangeType');
    const savedLastXDuration = localStorage.getItem('selectedLastXDuration');
    const savedStartDate = localStorage.getItem('selectedStartDate');
    const savedEndDate = localStorage.getItem('selectedEndDate');
    // Period loading is handled within updatePeriodSelect
    // Set initial data type (influences period select state)
    if (savedDataType) {
        const dataTypeOptions = Array.from(dataTypeSelect.options).map(option => option.value);
        if (dataTypeOptions.includes(savedDataType)) {
            dataTypeSelect.value = savedDataType;
        }
        else {
            dataTypeSelect.value = 'fundingRate'; // Default if saved type is not valid
        }
    }
    else {
        dataTypeSelect.value = 'fundingRate'; // Default if no saved type
    }
    // Call initially to set correct period select state and load saved period
    updatePeriodSelect(); // This must be called after setting dataTypeSelect.value
    // Set initial range type and load corresponding settings
    if (savedRangeType && (savedRangeType === 'dateRange' || savedRangeType === 'lastX')) {
        toggleRangeInputs(savedRangeType); // Apply the saved range type
        if (savedRangeType === 'lastX' && savedLastXDuration) {
            // Check if saved duration is a valid option
            if (lastXDurations.hasOwnProperty(savedLastXDuration)) {
                lastXDurationSelect.value = savedLastXDuration;
            }
            else {
                lastXDurationSelect.value = '1h'; // Default if saved duration is invalid
            }
        }
    }
    else {
        // Default to date range if no saved type or invalid saved type
        toggleRangeInputs('dateRange');
    }
    // Load saved dates only if dateRange is the selected type on load or if no saved type
    if (dateRangeInputsDiv.style.display !== 'none') { // Check the current UI state after loading saved rangeType
        if (savedStartDate) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(savedStartDate)) {
                startDateInput.value = savedStartDate;
            }
            else {
                startDateInput.value = formatDate(sevenDaysAgo); // Default if saved format is invalid
            }
        }
        else {
            startDateInput.value = formatDate(sevenDaysAgo);
        }
        if (savedEndDate) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(savedEndDate)) {
                endDateInput.value = savedEndDate;
            }
            else {
                endDateInput.value = formatDate(today); // Default if saved format is invalid
            }
        }
        else {
            endDateInput.value = formatDate(today);
        }
    }
    // Add event listener to data type select to update period options and saved settings
    dataTypeSelect.addEventListener('change', () => {
        updatePeriodSelect(); // Update period select state based on new data type and load relevant period setting
        localStorage.setItem('selectedDataType', dataTypeSelect.value); // Save the new data type
    });
    // Add event listeners to range type radio buttons
    rangeTypeDateRadio.addEventListener('change', () => toggleRangeInputs('dateRange'));
    rangeTypeLastRadio.addEventListener('change', () => toggleRangeInputs('lastX'));
    // Add event listeners to date inputs to save settings (only relevant if dateRange is active)
    startDateInput.addEventListener('change', () => {
        if (rangeTypeDateRadio.checked) { // Only save if date range is currently selected
            localStorage.setItem('selectedStartDate', startDateInput.value);
        }
    });
    endDateInput.addEventListener('change', () => {
        if (rangeTypeDateRadio.checked) { // Only save if date range is currently selected
            localStorage.setItem('selectedEndDate', endDateInput.value);
        }
    });
    // Add event listener to last X duration select to save settings (only relevant if lastX is active)
    lastXDurationSelect.addEventListener('change', () => {
        if (rangeTypeLastRadio.checked) { // Only save if lastX is currently selected
            localStorage.setItem('selectedLastXDuration', lastXDurationSelect.value);
        }
    });
    // Add event listener to period select to save settings
    periodSelect.addEventListener('change', () => {
        // Only save the period if the select is not disabled
        if (!periodSelect.disabled) {
            localStorage.setItem('selectedPeriod', periodSelect.value);
        }
    });
    // Event listener for the fetch button
    fetchButton.addEventListener('click', async () => {
        const dataType = dataTypeSelect.value;
        // If periodSelect is disabled (i.e., dataType is fundingRate), use its value ('1h').
        // Otherwise, use the selected value.
        const period = periodSelect.disabled ? periodSelect.value : periodSelect.value;
        const rangeType = rangeTypeDateRadio.checked ? 'dateRange' : 'lastX'; // Determine current range type
        let startTimestamp;
        let endTimeStamp;
        if (rangeType === 'dateRange') {
            const startDateStr = startDateInput.value;
            const endDateStr = endDateInput.value;
            // Simple client-side validation for date range
            if (!startDateStr || !endDateStr) {
                alert('Please select both start and end dates.');
                return;
            }
            // Convert dates to timestamps (start of the day UTC)
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            // Add one day to the end date timestamp to include the entire end day
            const endOfDay = new Date(endDate);
            endOfDay.setDate(endDate.getDate() + 1); // Start of the next day
            startTimestamp = startDate.getTime();
            endTimeStamp = endOfDay.getTime();
            if (startTimestamp >= endTimeStamp) {
                alert('Start date must be before end date.');
                return;
            }
        }
        else { // rangeType === 'lastX'
            const selectedDurationText = lastXDurationSelect.value;
            const durationInMillis = lastXDurations[selectedDurationText]; // Get milliseconds from map
            if (!durationInMillis) {
                alert('Invalid duration selected.');
                return;
            }
            endTimeStamp = Date.now(); // Current time in UTC milliseconds
            startTimestamp = endTimeStamp - durationInMillis;
            // Optional: Add a check to prevent fetching excessively old data if the duration is very large,
            // though the backend's maxAttempts acts as a safeguard too.
            // You might want to enforce a max "last X" duration here based on API limits/performance.
            const maxLastXMillis = 30 * 24 * 60 * 60 * 1000; // Example: Max 30 days for "Last X"
            if (durationInMillis > maxLastXMillis) {
                // This validation might be better placed by controlling dropdown options,
                // but as a safeguard:
                console.warn(`Requested "Last ${selectedDurationText}" exceeds recommended maximum. Fetching might take longer.`);
                // alert(`Please select a duration within the last ${maxLastXMillis / (24 * 60 * 60 * 1000)} days.`);
                // return; // Optionally stop here
            }
        }
        // Period is required for non-fundingRate types, and the select should not be disabled in that case.
        // If the select is disabled, it's fundingRate, and we don't need a period check.
        if (!periodSelect.disabled && !period) {
            alert('Please select a period for the selected data type.');
            return;
        }
        // Clear previous results and errors
        resultsDiv.innerHTML = '<p>Fetching data... This may take a while for large date ranges due to API limits and throttling.</p>';
        responseOutputDiv.innerHTML = '<p>Waiting for response...</p>';
        responseOutputDiv.classList.remove('error'); // Remove error class
        dataInfoDiv.innerHTML = '<p>Fetching data info...</p>'; // Clear previous data info
        fetchButton.disabled = true;
        loadingIndicator.style.display = 'block';
        try {
            // Construct the API URL
            // Only include period in the API call if the data type is NOT fundingRate
            const apiUrl = `/api/data?dataType=${dataType}&startTime=${startTimestamp}&endTime=${endTimeStamp}${dataType !== 'fundingRate' ? `&period=${period}` : ''}`;
            console.log(`Fetching URL: ${apiUrl}`); // Log the generated API URL
            // Make the API call
            const response = await fetch(apiUrl);
            // Read the response body as text first to handle potential non-JSON errors
            const responseText = await response.text();
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            }
            catch (parseError) {
                // If parsing fails, it means the response wasn't JSON (e.g., server error page)
                console.error('Failed to parse JSON response:', responseText);
                responseOutputDiv.innerHTML = `<p>API Error: Invalid JSON response.</p><pre>${responseText}</pre>`;
                responseOutputDiv.classList.add('error');
                resultsDiv.innerHTML = '<p>Failed to fetch data due to invalid response from server.</p>';
                dataInfoDiv.innerHTML = '<p style="color: red;">Failed to fetch data info.</p>';
                return; // Stop processing
            }
            // Display raw response (formatted JSON)
            responseOutputDiv.innerHTML = `<pre>${JSON.stringify(responseData, null, 2)}</pre>`;
            if (responseData.success) {
                // Display fetched data info
                if (responseData.meta) {
                    dataInfoDiv.innerHTML = `
                         <p><strong>Data Type:</strong> ${responseData.meta.dataType}</p>
                         <p><strong>Period:</strong> ${responseData.meta.period}</p>
                         <p><strong>Time Range (UTC):</strong> ${new Date(responseData.meta.startTime).toISOString()} to ${new Date(responseData.meta.endTime).toISOString()} (Exclusive of End)</p>
                         <p><strong>Records Fetched (within range):</strong> ${responseData.meta.recordCount}</p>
                         <p><strong>Total Unique Records from API Calls:</strong> ${responseData.meta.totalUniqueRecordsFetched}</p>
                     `;
                }
                else {
                    dataInfoDiv.innerHTML = '<p>No metadata received.</p>';
                }
                // Display fetched data
                if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
                    // Cast data to our frontend interface type for safer access
                    const data = responseData.data;
                    // Determine headers from the first record
                    const headers = Object.keys(data[0]);
                    let tableHtml = `<table><thead><tr>`; // Use a more descriptive header perhaps?
                    headers.forEach(header => {
                        // Improve header readability (e.g., sumOpenInterest -> Sum Open Interest)
                        const readableHeader = header
                            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                            .replace(/_/g, ' ') // Replace underscores with spaces
                            .trim()
                            .replace(/^./, str => str.toUpperCase()); // Capitalize the first letter
                        tableHtml += `<th>${readableHeader}</th>`;
                    });
                    tableHtml += '</tr></thead><tbody>';
                    data.forEach((row) => {
                        tableHtml += '<tr>';
                        headers.forEach(header => {
                            let cellValue = row[header]; // Access properties safely via index signature
                            // Format timestamp column for better readability
                            if (header === 'timestamp' || header === 'fundingTime') {
                                // Ensure the value is a number before creating a Date object
                                cellValue = typeof cellValue === 'number' ? new Date(cellValue).toISOString() : String(cellValue); // Convert to string if not a number
                            }
                            else if (typeof cellValue === 'number') {
                                cellValue = cellValue.toFixed(8); // Format numbers to 8 decimal places
                            }
                            else if (typeof cellValue !== 'string') {
                                cellValue = String(cellValue); // Ensure all other types are strings
                            }
                            tableHtml += `<td>${cellValue}</td>`;
                        });
                        tableHtml += '</tr>';
                    });
                    tableHtml += '</tbody></table>';
                    resultsDiv.innerHTML = tableHtml;
                }
                else {
                    resultsDiv.innerHTML = '<p>No data found for the selected range.</p>';
                }
            }
            else {
                // Display backend error message
                resultsDiv.innerHTML = `<p>Backend Error: ${responseData.message}</p>`;
                responseOutputDiv.classList.add('error'); // Add error class for styling
                dataInfoDiv.innerHTML = `<p style="color: red;">Backend Error: ${responseData.message}</p>`;
            }
        }
        catch (error) {
            // Handle network or other unexpected errors
            console.error('Fetch error:', error);
            resultsDiv.innerHTML = `<p>An error occurred while making the request.</p>`;
            responseOutputDiv.innerHTML = `<p>Network Error: ${error.message}</p>`;
            responseOutputDiv.classList.add('error');
            dataInfoDiv.innerHTML = `<p style="color: red;">Network Error: ${error.message}</p>`;
        }
        finally {
            // Re-enable button and hide loading indicator
            fetchButton.disabled = false;
            loadingIndicator.style.display = 'none';
        }
    });
    // Initial setup on page load
    const initialRangeType = localStorage.getItem('selectedRangeType') || 'dateRange';
    toggleRangeInputs(initialRangeType); // Set initial UI state
    updatePeriodSelect(); // Set initial period select state and load saved period
});
