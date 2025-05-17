import { IRawTakerBuySellVolumeRecord } from "../binance";
import { DatasetBuilder } from "./dataset-builder";
import { ITakerBuySellVolumeRecord, ITakerBuySellVolumeService } from "./interfaces";

export class TakerBuySellVolumeService extends DatasetBuilder implements ITakerBuySellVolumeService {
    constructor() {
        super("./output/taker_buy_sell_volume.csv", 30); // Assuming 30 days default lookback
    }

    /*** Retrieves the next dataset items based on the given starting point.* Calls the binance service to get a chunk of data from start_at.* @param start_at - The timestamp to start fetching from (in ms).* @returns Promise<ITakerBuySellVolumeRecord[]>*/
    protected async get_next_ds_items(start_at: number): Promise<ITakerBuySellVolumeRecord[]> {
        // Retrieve the records from Binance's API
        // Pass undefined for end_time so the binanceService uses start_time and limit.
        // Pass the period (e.g., '5m' - hardcoded here)
        const records: IRawTakerBuySellVolumeRecord[] = await this._binance.get_taker_buy_sell_volume_history(start_at, undefined, '5m'); // Assuming '5m' period for dataset

        // Finally, format the items and return them
        return records.map((r) => {
            return <ITakerBuySellVolumeRecord>{
                timestamp: r.timestamp,
                buy_vol: this.format_number(r.buyVol, 4),
                sell_vol: this.format_number(r.sellVol, 4),
                buy_sell_ratio: this.format_number(r.buySellRatio, 4)
            }
        });
    }
}
