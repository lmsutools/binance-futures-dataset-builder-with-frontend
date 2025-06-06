import { IRawOpenInterestRecord } from "../binance";
import { DatasetBuilder } from "./dataset-builder";
import { IOpenInterestRecord, IOpenInterestService } from "./interfaces";

export class OpenInterestService extends DatasetBuilder implements IOpenInterestService {
    constructor() {
        super("./output/open_interest.csv", 30); // Assuming 30 days default lookback if no file exists
    }

    /*** Retrieves the next dataset items based on the given starting point.* Calls the binance service to get a chunk of data from start_at.* @param start_at - The timestamp to start fetching from (in ms).* @returns Promise<IOpenInterestRecord[]>*/
    protected async get_next_ds_items(start_at: number): Promise<IOpenInterestRecord[]> {
        // Retrieve the records from Binance's API
        // Pass undefined for end_time so the binanceService uses start_time and limit.
        // Pass the period (e.g., '5m' - hardcoded here, but could potentially be configurable per dataset)
        const records: IRawOpenInterestRecord[] = await this._binance.get_open_interest_history(start_at, undefined, '5m'); // Assuming '5m' period for dataset

        // Finally, format the items and return them
        return records.map((r) => {
            return <IOpenInterestRecord>{
                timestamp: r.timestamp,
                sum_open_interest: this.format_number(r.sumOpenInterest, 8),
                sum_open_interest_value: this.format_number(r.sumOpenInterestValue, 8)
            }
        });
    }
}
