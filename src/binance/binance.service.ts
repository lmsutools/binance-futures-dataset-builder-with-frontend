import moment from "moment";
import {
    ExternalRequestService,
    IExternalRequestOptions,
    IExternalRequestResponse,
    IExternalRequestService
} from "../external-request";
import { request_throttle } from "./request-throttle";
import {
    IBinanceService,
    IQueryDateRange,
    IRawFundingRateRecord,
    IRawLongShortRatioRecord,
    IRawOpenInterestRecord,
    IRawTakerBuySellVolumeRecord
} from "./interfaces";

export class BinanceService implements IBinanceService {
    // Binance's Request Options Skeleton
    private readonly request_options: IExternalRequestOptions = {
        host: "fapi.binance.com",
        path: "",
        method: "GET",
        headers: { "Content-Type": "application/json" }
    }

    // External Request Service
    private _external_request: IExternalRequestService;

    constructor() {
        // Initialize the external request instance
        this._external_request = new ExternalRequestService();
    }

    /*** Retrieves the funding rate history based on given time range.* If end_time is not provided, it fetches a chunk from start_time using a limit.* @param start_time - The start time for the query (in ms).* @param end_time - Optional. The end time for the query (in ms).* @returns Promise<IRawFundingRateRecord[]>*/
    @request_throttle()
    public async get_funding_rate_history(start_time: number, end_time?: number): Promise<IRawFundingRateRecord[]> {
        let path = `/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1000&startTime=${start_time}`;
        if (end_time !== undefined) {
            path += `&endTime=${end_time}`;
        }

        // Send the request
        const response: IExternalRequestResponse = await this._external_request.request({
            ...this.request_options,
            path: path
        });

        // Validate the response
        this.validate_request_response(response);

        // Return the series
        return response.data;
    }

    /*** Retrieves the open interest history based on given time range and period.* If end_time is not provided, it fetches a chunk from start_time using a limit.* @param start_time - The start time for the query (in ms).* @param end_time - Optional. The end time for the query (in ms).* @param period - The data period (e.g., '5m', '1h', '1d'). Required if end_time is provided or for dataset builder.* @returns Promise<IRawOpenInterestRecord[]>*/
    @request_throttle()
    public async get_open_interest_history(start_time: number, end_time?: number, period?: string): Promise<IRawOpenInterestRecord[]> {
         if (period === undefined && end_time !== undefined) {
             // Period is required for the API endpoint calls if end_time is set
             throw new Error("Period is required when providing an end_time for open interest history.");
         }
         if (period === undefined) {
             // Default period if none is provided (primarily for dataset builder compatibility)
             // This might need refinement depending on dataset builder's expectations
             period = '5m';
         }

        let path = `/futures/data/openInterestHist?symbol=BTCUSDT&period=${period}&limit=500&startTime=${start_time}`;
        if (end_time !== undefined) {
            path += `&endTime=${end_time}`;
        }

        // Send the request
        const response: IExternalRequestResponse = await this._external_request.request({
            ...this.request_options,
            path: path
        });

        // Validate the response
        this.validate_request_response(response);

        // Return the series
        return response.data;
    }

    /*** Retrieves the long/short ratio history based on given time range and period.* If end_time is not provided, it fetches a chunk from start_time using a limit.* @param start_time - The start time for the query (in ms).* @param end_time - Optional. The end time for the query (in ms).* @param period - The data period (e.g., '5m', '1h', '1d'). Required if end_time is provided or for dataset builder.* @returns Promise<IRawLongShortRatioRecord[]>*/
    @request_throttle()
    public async get_long_short_ratio_history(start_time: number, end_time?: number, period?: string): Promise<IRawLongShortRatioRecord[]> {
         if (period === undefined && end_time !== undefined) {
             throw new Error("Period is required when providing an end_time for long/short ratio history.");
         }
         if (period === undefined) {
             period = '5m';
         }

        let path = `/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=${period}&limit=500&startTime=${start_time}`;
         if (end_time !== undefined) {
            path += `&endTime=${end_time}`;
        }

        // Send the request
        const response: IExternalRequestResponse = await this._external_request.request({
            ...this.request_options,
            path: path
        });

        // Validate the response
        this.validate_request_response(response);

        // Return the series
        return response.data;
    }

    /*** Retrieves the taker buy/sell volume history based on given time range and period.* If end_time is not provided, it fetches a chunk from start_time using a limit.* @param start_time - The start time for the query (in ms).* @param end_time - Optional. The end time for the query (in ms).* @param period - The data period (e.e.g., '5m', '1h', '1d'). Required if end_time is provided or for dataset builder.* @returns Promise<IRawTakerBuySellVolumeRecord[]>*/
    @request_throttle()
    public async get_taker_buy_sell_volume_history(start_time: number, end_time?: number, period?: string): Promise<IRawTakerBuySellVolumeRecord[]> {
         if (period === undefined && end_time !== undefined) {
             throw new Error("Period is required when providing an end_time for taker buy/sell volume history.");
         }
         if (period === undefined) {
             period = '5m';
         }

        let path = `/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=${period}&limit=500&startTime=${start_time}`;
         if (end_time !== undefined) {
            path += `&endTime=${end_time}`;
        }

        // Send the request
        const response: IExternalRequestResponse = await this._external_request.request({
            ...this.request_options,
            path: path
        });

        // Validate the response
        this.validate_request_response(response);

        // Return the series
        return response.data;
    }

    /***************** Misc Helpers *****************/

    /*** Given an HTTP Response object, it will ensure the request was* processed correctly and has the correct status code.* @param response* @param validate_data*/
    private validate_request_response(response: IExternalRequestResponse, validate_data: boolean = true): void {
        // Ensure it is a valid object
        if (!response || typeof response != "object") {
            console.log(response);
            throw new Error("Binance's API returned an invalid response object.");
        }

        // Ensure the status code is valid
        if (response.status_code != 200) {
             let errorMessage = `Binance's API returned an invalid HTTP response code. Expected: 200, Received: ${response.status_code}.`;
             if (response.data && typeof response.data === 'object' && response.data.msg) {
                 // Include Binance's error message if available
                 errorMessage += ` Message: ${response.data.msg}`;
             }
            throw new Error(errorMessage);
        }

        // Validate the response's data
        if (validate_data && !Array.isArray(response.data)) {
            console.log(response.data);
            throw new Error(`Binance's API returned an invalid series of records. Received: ${typeof response.data}`);
        }
    }

     // The calculate_query_date_range method is removed from here as the API methods now accept start and end times directly.
     // This helper was more relevant for the dataset builder's fixed lookback logic.
}
