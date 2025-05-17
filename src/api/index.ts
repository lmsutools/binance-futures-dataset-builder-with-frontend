import express, { Request, Response } from 'express';
import path from 'path';
import moment from 'moment';
import { BinanceService, IBinanceService, IRawFundingRateRecord, IRawOpenInterestRecord, IRawLongShortRatioRecord, IRawTakerBuySellVolumeRecord } from '../binance';

const app = express();
const port = process.env.PORT || 3000;

// Initialize the Binance Service
const binanceService: IBinanceService = new BinanceService();

// Serve static files from the 'public' directory within the compiled dist folder
// The compiled public files will be in dist/public relative to the project root
// The api/index.js file will be in dist/api, so need to go up two levels (../../)
app.use(express.static(path.join(__dirname, '../../public')));

// Helper function to get the timestamp property based on data type
// This function safely accesses either 'timestamp' or 'fundingTime'
function getRecordTimestamp(record: any, dataType: string): number {
    let ts: any; // Use any initially as property name varies
    switch (dataType) {
        case 'fundingRate':
            // Cast to the specific type to access the known property name
            const frRecord = record as IRawFundingRateRecord;
            ts = frRecord.fundingTime;
            break;
        case 'openInterest':
            const oiRecord = record as IRawOpenInterestRecord;
            ts = oiRecord.timestamp;
            break;
        case 'longShortRatio':
            const lsrRecord = record as IRawLongShortRatioRecord;
            ts = lsrRecord.timestamp;
            break;
        case 'takerVolume':
            const tvRecord = record as IRawTakerBuySellVolumeRecord;
            ts = tvRecord.timestamp;
            break;
        default:
            // Should not happen if dataType validation before this is correct
            throw new Error(`Unknown data type ${dataType} in getRecordTimestamp.`);
    }

    // Validate that the found timestamp is a number
    if (typeof ts === 'number') {
        return ts;
    } else {
        // Log the problematic record for debugging
        console.error('Invalid timestamp found for record:', record, 'with dataType:', dataType, 'Timestamp value:', ts);
        // Throw an error if a valid timestamp could not be retrieved
        throw new Error('Invalid record structure: timestamp property missing or not a number.');
    }
}

// Define the API endpoint for fetching data
app.get('/api/data', async (req: Request, res: Response) => {
    const { dataType, startTime, endTime, period } = req.query; // Added period

    // Basic validation
    if (!dataType || typeof dataType !== 'string' ||
        !startTime || typeof startTime !== 'string' ||
        !endTime || typeof endTime !== 'string' ||
        (dataType !== 'fundingRate' && (!period || typeof period !== 'string')) // Period is required for non-funding rate types
    ) {
        return res.status(400).json({
            success: false,
            message: 'Missing or invalid required parameters: dataType, startTime, endTime, and period (for non-fundingRate).',
            details: null
        });
    }

    const startTimestamp = parseInt(startTime as string, 10);
    const endTimeStamp = parseInt(endTime as string, 10);

    if (isNaN(startTimestamp) || isNaN(endTimeStamp) || startTimestamp >= endTimeStamp) {
        return res.status(400).json({
            success: false,
            message: 'Invalid startTime or endTime. Must be valid timestamps (ms) and startTime must be less than endTime.',
            details: null
        });
    }

    console.log(`API Request: Fetching ${dataType} with period ${period} from ${moment(startTimestamp).toISOString()} to ${moment(endTimeStamp).toISOString()}`);

    try {
        let fetchedRecords: any[] = [];
        // Increased attempts, but the logic for advancing currentStartTime is more critical now.
        const maxAttempts = 200;
        let attempts = 0;
        let currentStartTime = startTimestamp;

        // Determine the batch size based on data type and period.
        // Binance API limits are typically 500 for 5m data, 1000 for funding rate (hourly).
        // The exact max time range per call depends on the period and limit.
        // We'll use a general batch duration strategy that should work for most periods,
        // but a more precise calculation based on period and limit would be better.
        // For simplicity, let's estimate a batch duration (e.g., 1 day in milliseconds).
        // A more robust approach would use the actual limit (500 or 1000) and the period
        // to calculate the duration covered by one batch of records.
        const oneDayMillis = 24 * 60 * 60 * 1000;
        // Let's make the batch duration adaptive, aiming for roughly one day or less per batch for smaller periods.
        // For larger periods, we might be able to fetch more in one go, but Binance's API has other limits (e.g., max 200 days for fundingRateHist).
        // Given the current BinanceService fetches based on a fixed 'query_days_length' which is not ideal for arbitrary periods,
        // let's simplify the API loop's batching strategy: Fetch up to 'endTimeStamp' in chunks.
        // The BinanceService methods will now need to accept a specific `endTime` for the batch.
        // We will still use the last timestamp + 1ms approach to advance, but ensure the batch endTime doesn't exceed the overall requested endTimeStamp.

        const batchDurationGuess = oneDayMillis; // Rough estimate, the BinanceService call logic is more important

        while (currentStartTime < endTimeStamp && attempts < maxAttempts) {
            let batch: any[] = [];
            // Calculate the end time for the current batch. Don't exceed the overall requested endTimeStamp.
            const batchEndTime = Math.min(currentStartTime + batchDurationGuess, endTimeStamp);


            try {
                switch (dataType) {
                    case 'fundingRate':
                        // Funding Rate endpoint doesn't support period parameter in the same way as others
                        // The get_funding_rate_history method needs to be updated to accept endTime
                        batch = await binanceService.get_funding_rate_history(currentStartTime, batchEndTime);
                        break;
                    case 'openInterest':
                        // These methods now need to accept endTime and period
                        batch = await binanceService.get_open_interest_history(currentStartTime, batchEndTime, period as string);
                        break;
                    case 'longShortRatio':
                        batch = await binanceService.get_long_short_ratio_history(currentStartTime, batchEndTime, period as string);
                        break;
                    case 'takerVolume':
                        batch = await binanceService.get_taker_buy_sell_volume_history(currentStartTime, batchEndTime, period as string);
                        break;
                    default:
                        // This case should be caught by the initial validation, but included for safety
                        return res.status(400).json({
                            success: false,
                            message: `Unsupported data type: ${dataType}. Supported types: fundingRate, openInterest, longShortRatio, takerVolume.`,
                            details: null
                        });
                }
            } catch (fetchError: any) {
                console.error(`Error fetching batch for ${dataType} starting at ${moment(currentStartTime).toISOString()} to ${moment(batchEndTime).toISOString()}:`, fetchError.message);
                return res.status(500).json({
                    success: false,
                    message: `Failed to fetch data from Binance API for data type ${dataType}.`,
                    details: fetchError.message
                });
            }

            if (batch.length === 0) {
                console.log(`Batch for ${dataType} starting at ${moment(currentStartTime).toISOString()} returned 0 records. Assuming end of data or end of range.`);
                 // If no data was returned, but currentStartTime is still before endTimeStamp,
                 // it might mean there's a gap or end of available data.
                 // To prevent infinite loops, we should advance currentStartTime significantly
                 // or break if no progress is made for a few attempts.
                 // For now, let's assume if a batch is empty, we are at the end of available data in the range.
                break;
            }

             // Add fetched batch to total records.
            batch.forEach(record => {
                try {
                    // Add the record to a temporary list. De-duplication and final filtering happens later.
                    // Only add records within the *overall* requested range to be safe, although the API call should handle this.
                    const recordTimestamp = getRecordTimestamp(record, dataType);
                    if (recordTimestamp >= startTimestamp && recordTimestamp < endTimeStamp) {
                         fetchedRecords.push(record);
                    }
                } catch(e) {
                    console.warn("Skipping malformed record during batch processing:", record, e);
                }
            });

            // Find the timestamp of the latest record in the batch to set the next start time.
            // Sorting the batch ensures we get the correct latest timestamp.
            const sortedBatch = batch.sort((a, b) => {
                try {
                    const tsA = getRecordTimestamp(a, dataType);
                    const tsB = getRecordTimestamp(b, dataType);
                    return tsA - tsB;
                } catch (e) {
                    console.error("Error getting timestamp during batch sort:", e);
                    return 0; // May cause unpredictable sort order for bad records
                }
            });

            const latestRecord = sortedBatch[sortedBatch.length - 1];

            // Set the next start time to the timestamp of the latest record + 1 ms
            // This ensures the next query starts immediately after the last record received, preventing duplicates at the boundary.
            try {
                 const latestTimestamp = getRecordTimestamp(latestRecord, dataType);

                 // If the latest timestamp from this batch is less than or equal to the start time we used for this batch,
                 // it means we haven't made significant progress or the API is returning the same data.
                 // Add a check to ensure we are advancing.
                 if (latestTimestamp <= currentStartTime && batch.length > 0) {
                     console.warn(`Latest timestamp (${moment(latestTimestamp).toISOString()}) from batch starting at ${moment(currentStartTime).toISOString()} is not strictly after start time. Breaking loop to prevent infinite loop.`);
                     break; // Prevent infinite loop if API returns same data repeatedly
                 }

                 currentStartTime = latestTimestamp + 1;

                 // Also break if the new start time is already past the requested end time
                 if (currentStartTime >= endTimeStamp) { // Use >= here as the batch could include the endTimeStamp itself
                     console.log("Reached or surpassed end timeStamp. Stopping fetch.");
                     break;
                 }

            } catch(e) {
                console.error("Error getting timestamp for latest record in batch:", latestRecord, e);
                // If the last record in a batch is invalid, break the loop to prevent infinite loop
                break;
            }

            attempts++;

            if (attempts >= maxAttempts) {
                console.warn(`Max attempts (${maxAttempts}) reached for ${dataType} with period ${period} without reaching end time ${moment(endTimeStamp).toISOString()}. Stopping fetch.`);
                break;
            }
        }

        // Filter records to be within the requested endTime (exclusive of endTimeStamp)
        // And de-duplicate records using a Map by their timestamp
        const uniqueRecordsMap = new Map<number, any>(); // Map key is timestamp, value is the record
        fetchedRecords.forEach(record => {
            let ts: number;
            try {
                ts = getRecordTimestamp(record, dataType);
            } catch (e) {
                console.warn("Skipping record with invalid timestamp during final processing:", record);
                return; // Skip this record
            }

            // Ensure timestamp is within the requested range [startTimestamp, endTimeStamp)
            // endTimeStamp is the start of the day *after* the user's selected end date from the frontend.
            // This means records up to 23:59:59.999 of the end date will be included.
            if (ts >= startTimestamp && ts < endTimeStamp) {
                // Use the timestamp as the key to filter duplicates. Map keeps the last one added if timestamps are identical.
                // Since we increment start time by +1ms for subsequent calls, identical timestamps should be rare unless API is buggy.
                uniqueRecordsMap.set(ts, record);
            }
        });

        // Convert map values back to an array and sort by timestamp
        const data = Array.from(uniqueRecordsMap.values()).sort((a, b) => {
            try {
                const tsA = getRecordTimestamp(a, dataType);
                const tsB = getRecordTimestamp(b, dataType);
                return tsA - tsB;
            } catch (e) {
                // This catch should not be reached if getRecordTimestamp throws on invalid records
                console.error("Error getting timestamp during final sort:", e);
                return 0; // Should not happen if filtered records are valid
            }
        });

        console.log(`API Request: Successfully fetched and filtered ${data.length} records for ${dataType} with period ${period} within the requested range.`);
        console.log(`Total unique records processed from API calls before range filtering: ${fetchedRecords.length}`);
        console.log(`Total unique records within requested range [${moment(startTimestamp).toISOString()}, ${moment(endTimeStamp).toISOString()}): ${data.length}`);


        res.json({
            success: true,
            message: 'Data fetched successfully.',
            data: data,
            meta: {
                dataType,
                period: dataType === 'fundingRate' ? '1h' : period, // Funding rate is effectively hourly on the endpoint used
                startTime: startTimestamp,
                endTime: endTimeStamp, // This is the start of the day AFTER the user's selected end date
                requestedEndDate: moment(endTimeStamp - 1).format('YYYY-MM-DD'), // For clarity in frontend
                recordCount: data.length, // Count after filtering by range
                totalUniqueRecordsFetched: uniqueRecordsMap.size // Count of unique records from API within the range [startTimestamp, endTimeStamp)
            }
        });

    } catch (error: any) {
        console.error(`API Request Error for ${dataType} with period ${period}:`, error.message);
        const errorMessage = error.message || 'An unknown error occurred.';
        res.status(500).json({
            success: false,
            message: `An error occurred while processing your request for data type ${dataType}.`,
            details: errorMessage
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Frontend available at http://localhost:${port}/`);
});
