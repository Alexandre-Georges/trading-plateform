var https = require('https');
var moment = require('moment');
var d3fc = require('d3fc');

var financeService = {
    DATE_FORMAT: 'YYYY-MM-DD',
    DISPLAY_DATE_FORMAT: 'ddd D MMM YYYY',
    URL: 'query.yahooapis.com',
    BASE_PATH: '/v1/public/yql',
    QUERY_PARAM: 'q=',
    FORMAT_PARAM: 'format=',
    FORMAT_VALUE: 'json',
    ENV_PARAM: 'env=',
    ENV_VALUE: 'store://datatables.org/alltableswithkeys',
    CALLBACK_PARAM: 'callback=',
    STREAM: 'user%2F7be76130-1791-4670-befa-9aabdc9a4837%2Fcategory%2Ffinance',
    NEWS_NUMBER: 20,
    INDICATORS_CONFIG: {
        shortEMA: {
            periods: 13,
            name: 'shortEMA'
        },
        longEMA: {
            periods: 26,
            name: 'longEMA'
        },
        enveloppe: {
            factor: 0.05,
            name: 'shortEMA'
        },
        macd: {
            fastPeriod: 4,
            slowPeriod: 10,
            signalPeriod: 5
        },
        impulseSystem: {
            emaName: 'shortEMA'
        }
    },
    buildPath (query) {
        return financeService.BASE_PATH
            + '?' + financeService.QUERY_PARAM + encodeURIComponent(query)
            + '&' + financeService.FORMAT_PARAM + financeService.FORMAT_VALUE
            + '&' + financeService.ENV_PARAM + encodeURIComponent(financeService.ENV_VALUE)
            + '&' + financeService.CALLBACK_PARAM;
    },
    formatData (data) {

        var self = this;
        var formattedData = [];
        var currentSymbolData = null;

        for(let result of data.query.results.quote) {

            if (!currentSymbolData || currentSymbolData.symbol !== result.Symbol) {
                currentSymbolData = {
                    symbol: result.Symbol,
                    data: []
                };
                formattedData.push(currentSymbolData);
            }

            currentSymbolData.data.push({
                date: moment(result.Date, self.DATE_FORMAT).toISOString(),
                open: parseFloat(result.Open),
                close: parseFloat(result.Close),
                high: parseFloat(result.High),
                low: parseFloat(result.Low),
                volume: parseInt(result.Volume)
            });
        }
        return formattedData;
    },
    toWeeklyData (data) {

        var weeklyData = [];

        for (let dailySymbolData of data) {

            var weeklySymbolData = {
                symbol: dailySymbolData.symbol,
                data: []
            };
            weeklyData.push(weeklySymbolData);

            var currentWeekNumber = -1;
            var currentWeekDate = null;
            var currentWeekOpen = -1;
            var currentWeekHigh = -1;
            var currentWeekLow = -1;
            var currentWeekVolume = -1;

            var previousDataPoint = null;
            for (let dataPoint of dailySymbolData.data) {
                var dataWeekNumber = moment(dataPoint.date).week();
                if (currentWeekNumber !== dataWeekNumber) {
                    if (previousDataPoint) {
                        weeklySymbolData.data.push({
                            date: currentWeekDate,
                            open: currentWeekOpen,
                            close: previousDataPoint.close,
                            high: currentWeekHigh,
                            low: currentWeekLow,
                            volume: currentWeekVolume
                        });
                    }

                    currentWeekNumber = dataWeekNumber;
                    currentWeekDate = dataPoint.date;
                    currentWeekOpen = dataPoint.open;
                    currentWeekHigh = dataPoint.high;
                    currentWeekLow = dataPoint.low;
                    currentWeekVolume = dataPoint.volume;
                } else {
                    if (currentWeekHigh < dataPoint.high) {
                        currentWeekHigh = dataPoint.high;
                    }
                    if (currentWeekLow > dataPoint.low) {
                        currentWeekLow = dataPoint.low;
                    }
                    currentWeekVolume += dataPoint.volume;
                }
                previousDataPoint = dataPoint;
            }
            weeklySymbolData.data.push({
                date: currentWeekDate,
                open: currentWeekOpen,
                close: previousDataPoint.close,
                high: currentWeekHigh,
                low: currentWeekLow,
                volume: currentWeekVolume
            });
        }
        return weeklyData;
    },
    addEMA (config, data) {
        var movingAverage = d3fc.indicator.algorithm.exponentialMovingAverage().windowSize(config.periods).merge((dataPoint, ema) => {
            dataPoint[config.name] = ema;
        });
        movingAverage(data);
        return data;
    },
    addMACD (data) {
        var macdAlgorithm = d3fc.indicator.algorithm.macd()
            .fastPeriod(this.INDICATORS_CONFIG.macd.fastPeriod)
            .slowPeriod(this.INDICATORS_CONFIG.macd.slowPeriod)
            .signalPeriod(this.INDICATORS_CONFIG.macd.signalPeriod);
        macdAlgorithm(data);

        return data;
    },
    addEnveloppe (data) {
        var self = this;
        var envelopeAlgorithm = d3fc.indicator.algorithm.envelope()
            .factor(this.INDICATORS_CONFIG.enveloppe.factor)
            .value(dataPoint => { return dataPoint[self.INDICATORS_CONFIG.enveloppe.name]; });
        envelopeAlgorithm(data);

        return data;
    },
    addImpulseSystem (data) {
        var self = this;

        var previousEMA = null;
        var previousMacdHistogram = null;
        data.forEach(dataPoint => {
            var ema = dataPoint[self.INDICATORS_CONFIG.impulseSystem.emaName];
            var macd = dataPoint.macd;

            if (ema !== undefined && macd !== undefined) {
                if (previousEMA) {
                    var colour = 'blue';
                    if (previousEMA < ema && previousMacdHistogram < macd.divergence) {
                        colour = 'green';
                    } else if (previousEMA > ema && previousMacdHistogram > macd.divergence) {
                        colour = 'red';
                    }
                    dataPoint.impulse = colour;
                }
                previousEMA = ema;
                previousMacdHistogram = macd.divergence;
            }

        });

        return data;
    },
    addIndicators (data) {

        for (let symbolData of data) {

            symbolData.data = this.addEMA(this.INDICATORS_CONFIG.shortEMA, symbolData.data);
            symbolData.data = this.addEMA(this.INDICATORS_CONFIG.longEMA, symbolData.data);
            symbolData.data = this.addEnveloppe(symbolData.data);
            symbolData.data = this.addMACD(symbolData.data);
            symbolData.data = this.addImpulseSystem(symbolData.data);
        }

        return data;
    },
    getData (symbols) {
        return new Promise((callback, errorCallback) => {
            try {

                var symbolsString = '';
                for (var index = 0; index < symbols.length; index++) {
                    if (index > 0) {
                        symbolsString += ',';
                    }
                    symbolsString += '"' + symbols[index] + '"';
                }

                https.get(
                    {
                        hostname: financeService.URL,
                        path: financeService.buildPath(`select * from yahoo.finance.historicaldata where symbol IN (${symbolsString}) and startDate = "2015-10-12" and endDate = "2016-05-12" | sort(field="Symbol", field="Date", descending="false")`)
                    }, (response) => {

                        var allData = '';

                        response.on('data', (data) => {
                            allData += data;
                        });
                        response.on('end', () => {
                            var responseData = JSON.parse(allData);
                            if (response.statusCode !== 200) {
                                errorCallback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                                return;
                            }
                            callback(responseData);
                        });

                }).on('error', (error) => {
                    errorCallback({ statusCode: 503, errorMessage: error });
                });
            } catch (exception) {
                errorCallback({ statusCode: 503, errorMessage: exception });
            }
        });
    }
};
module.exports = financeService;