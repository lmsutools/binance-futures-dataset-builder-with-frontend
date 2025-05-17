```markdown
# Binance Futures Dataset Builder

The dataset builder script extracts the most relevant market data straight from Binance's API and builds and stores a series of datasets that can be used in data science and machine learning projects.

These dataset files (updated quarterly) are hosted in Kaggle and can be downloaded from the following URLs:

**Funding Rate:** [Dataset File](https://www.kaggle.com/datasets/jesusgraterol/bitcoin-funding-rate-binance-futures) | [Dataset Notebook](https://www.kaggle.com/code/jesusgraterol/bitcoin-funding-rate-binance-futures-ds)

**Long/Short Ratio:** [Dataset File](https://www.kaggle.com/datasets/jesusgraterol/bitcoin-longshort-ratio-binance-futures) | [Dataset Notebook](https://www.kaggle.com/code/jesusgraterol/bitcoin-long-short-ratio-binance-futures-ds)

**Open Interest:** [Dataset File](https://www.kaggle.com/datasets/jesusgraterol/bitcoin-open-interest-binance-futures) | [Dataset Notebook](https://www.kaggle.com/code/jesusgraterol/bitcoin-open-interest-binance-futures-ds)

**Taker Buy/Sell Volume:** [Dataset File](https://www.kaggle.com/datasets/jesusgraterol/bitcoin-taker-buysell-volume-binance-futures) | [Dataset Notebook](https://www.kaggle.com/code/jesusgraterol/bitcoin-taker-buy-sell-volume-binance-futures-ds)


#
## Requirements

- NodeJS: ^v18.17.0

- NPM: ^v9.6.7

- Typescript: ^v5.1.6

**NOTE**: the versions listed above are the ones used to code the script. It may run on older|newer versions.



#
## Project Structure

```
binance_futures_dataset_builder/
└───dist/
    |   └──...
    node_modules/
    |   └──...
    output/ <- Dataset Files
    |   ├──funding_rate.csv
    |   ├──long_short_ratio.csv
    |   ├──open_interest.csv
    |   └──taker_buy_sell_volume.csv
    src/
    |   └──...
    .gitignore
    package-lock.json
    package.json
    README.md
    tsconfig.json
```





#
## Getting Started

Install dependencies with:

`npm install`

Initialize the syncing process and start the frontend server with:

`npm start`

**NOTE**: if the syncing execution were to fail and stop for any reason, it can be executed again without the risk of corrupting the dataset. Additionally, if your project requires a fresh dataset frequently, download the pruned file/files from [Kaggle](https://www.kaggle.com/jesusgraterol/datasets) and place it/them in the output directory.

#
## Frontend Interface

Running `npm start` also launches a simple web server that hosts a frontend interface. This interface allows you to manually fetch specific data types and time ranges from the Binance API and view the raw results directly in your browser. This is useful for testing and inspecting the data structure.

Access the frontend at: `http://localhost:3000/`

**Features:**

*   **Data Type Selection:** Choose from 'Funding Rate', 'Open Interest', 'Long/Short Ratio', and 'Taker Buy/Sell Volume'.
*   **Period Selection:** For 'Open Interest', 'Long/Short Ratio', and 'Taker Buy/Sell Volume', you can select the data granularity (e.g., 5m, 1h, 1d). The 'Funding Rate' is typically hourly, and the period selection is disabled for this type.
*   **Range Selection:** Choose how to specify the data range:
    *   **Date Range:** Select a specific start and end date using calendar inputs.
    *   **Last X Timeframe:** Select a predefined duration from the current time (e.g., Last 1 Hour, Last 7 Days).
*   **Settings Persistence:** Your last selected Data Type, Period, Range Type, dates, and Last X duration are automatically saved in your browser's local storage and will be remembered when you revisit the page.
*   **Results Display:** Fetched data is displayed in a simple table format, and the raw API response (including metadata like the exact fetched time range and record counts) is shown for debugging.

#
## Frontend Interface

Running `npm start` also launches a simple web server that hosts a frontend interface. This interface allows you to manually fetch specific data types and time ranges from the Binance API and view the raw results directly in your browser. This is useful for testing and inspecting the data structure.

Access the frontend at: `http://localhost:3000/`

**Features:**

*   **Data Type Selection:** Choose from 'Funding Rate', 'Open Interest', 'Long/Short Ratio', and 'Taker Buy/Sell Volume'.
*   **Period Selection:** For 'Open Interest', 'Long/Short Ratio', and 'Taker Buy/Sell Volume', you can select the data granularity (e.g., 5m, 1h, 1d). The 'Funding Rate' is typically hourly, and the period selection is disabled for this type.
*   **Range Selection:** Choose how to specify the data range:
    *   **Date Range:** Select a specific start and end date using calendar inputs.
    *   **Last X Timeframe:** Select a predefined duration from the current time (e.g., Last 1 Hour, Last 7 Days).
*   **Settings Persistence:** Your last selected Data Type, Period, Range Type, dates, and Last X duration are automatically saved in your browser's local storage and will be remembered when you revisit the page.
*   **Results Display:** Fetched data is displayed in a simple table format, and the raw API response (including metadata like the exact fetched time range and record counts) is shown for debugging.


#
## Dataset Schemas

### Funding Rate [?](https://www.binance.com/en/blog/futures/what-is-futures-funding-rate-and-why-it-matters-421499824684903247)


| Name | Type | Description
| ---- | ---- | -----------
| timestamp | int | The record's timestamp in milliseconds
| funding_rate | float | The funding rate value


### Open Interest [?](https://www.binance.com/en/blog/futures/what-information-does-open-interest-convey-421499824684900398)


| Name | Type | Description
| ---- | ---- | -----------
| timestamp | int | The record's timestamp in milliseconds
| sum_open_interest | float | Total open interest (BTC)
| sum_open_interest_value | float | Total open interest value (USDT)



### Long/Short Ratio [?](https://www.binance.com/en/blog/futures/what-is-longshort-ratio-and-what-does-it-convey-in-cryptocurrency-futures-6728490800036398885)


| Name | Type | Description
| ---- | ---- | -----------
| timestamp | int | The record's timestamp in milliseconds
| long_account | float | Long account num ratio of all traders
| short_account | float | Short account num ratio of all traders
| long_short_ratio | float | Long/Short account num ratio of all traders




### Taker Buy/Sell Volume [?](https://www.binance.com/en/feed/post/164092)


| Name | Type | Description
| ---- | ---- | -----------
| timestamp | int | The record's timestamp in milliseconds
| buy_vol | float | Total BTC volume bought by Takers
| sell_vol | float | Total BTC volume sold by Takers
| buy_sell_ratio | float | The taker buy/sell ratio



#
## Unit Tests

Since the dataset files are deeply analyzed in Jupyter|Kaggle Notebooks, no unit tests were written. If you wish to see more details regarding these datasets, please visit:

**Funding Rate:** [Dataset File](https://www.kaggle.com/datasets/jesusgraterol/bitcoin-funding-rate-binance-futures) | [Dataset Notebook](https://www.kaggle.com/code/jesusgraterol/bitcoin-funding-rate-binance-futures-ds)

**Long/Short Ratio:** [Dataset File](https://www.kaggle.com/datasets/jesusgraterol/bitcoin-longshort-ratio-binance-futures) | [Dataset Notebook](https://www.kaggle.com/code/jesusgraterol/bitcoin-long-short-ratio-binance-futures-ds)

**Open Interest:** [Dataset File](https://www.kaggle.com/datasets/jesusgraterol/bitcoin-open-interest-binance-futures) | [Dataset Notebook](https://www.kaggle.com/code/jesusgraterol/bitcoin-open-interest-binance-futures-ds)

**Taker Buy/Sell Volume:** [Dataset File](https://www.kaggle.com/datasets/jesusgraterol/bitcoin-taker-buysell-volume-binance-futures) | [Dataset Notebook](https://www.kaggle.com/code/jesusgraterol/bitcoin-taker-buy-sell-volume-binance-futures-ds)
```