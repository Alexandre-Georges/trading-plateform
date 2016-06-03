var newsService = require('./newsService.js');
var moment = require('moment');
var _ = require('underscore');
var promise = require('promise');

var httpUtilsService = {
    processError: function (response, statusCode, errorMessage) {
        response.writeHead(statusCode);
        response.end(JSON.stringify(errorMessage));
    },
    getData: function (request) {
        return new Promise((callback, errorCallback) => {
            try {
                var payload = '';

                request.on('data', (data) => {
                    payload += data;
                });
                request.on('end', () => {
                    callback(JSON.parse(payload));
                });
            } catch (exception) {
                errorCallback({ statusCode: 503, errorMessage: exception });
            }
        });
    },
    getNews: function (token) {
        return new Promise((callback, errorCallback) => {
            try {
                var unreadCountPromise = newsService.getUnreadCount(token);
                var newsPromise = newsService.getNews(token);

                promise.all([ unreadCountPromise, newsPromise ]).then(data => {
                    var unreadCountData = data[0];
                    var newsData = data[1];

                    var news = [];
                    var currentDate = moment();
                    _.each(newsData.items, item => {
                        news.push({
                            id: item.id,
                            title: item.title,
                            href: item.alternate[0].href,
                            time: httpUtilsService.getDifference(currentDate, moment(item.published))
                        });
                    });
                    callback({
                        unreadCount: unreadCountData.unreadcounts[0].count,
                        news: news
                    });
                }).catch(error => {
                    errorCallback(error);
                });

            } catch (exception) {
                errorCallback({ statusCode: 503, errorMessage: exception });
            }
        });
    },
    getDifference: function (currentDate, newsDate) {
        var monthDifference = currentDate.diff(newsDate, 'month');
        if (monthDifference >= 1) {
            return monthDifference + ' m';
        }
        var weekDifference = currentDate.diff(newsDate, 'week');
        if (weekDifference >= 1) {
            return weekDifference + ' w';
        }
        var dayDifference = currentDate.diff(newsDate, 'day');
        if (dayDifference >= 1) {
            return dayDifference + ' d';
        }
        var hourDifference = currentDate.diff(newsDate, 'hour');
        if (hourDifference >= 1) {
            return hourDifference + ' h';
        }
        var minuteDifference = currentDate.diff(newsDate, 'minute');
        if (minuteDifference >= 1) {
            return minuteDifference + ' m';
        }
        var secondDifference = currentDate.diff(newsDate, 'second');
        return secondDifference + ' s';
    }
};

module.exports = httpUtilsService;