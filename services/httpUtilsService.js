var newsService = require('./newsService.js');
var moment = require('moment');
var _ = require('underscore');

var httpUtilsService = {
    processError: function (response, statusCode, errorMessage) {
        response.writeHead(statusCode);
        response.end(JSON.stringify(errorMessage));
    },
    getData: function (request, callback) {
        var payload = '';

        request.on('data', (data) => {
            payload += data;
        });
        request.on('end', () => {
            callback(JSON.parse(payload));
        });
    },
    getNews: function (token, callback) {
        newsService.getUnreadCount(token, function (error, unreadCountData) {
            if (error) {
                callback(error);
                return;
            }
            newsService.getNews(token, function (error, newsData) {
                if (error) {
                    callback(error);
                    return;
                }
                var news = [];
                var currentDate = moment();
                _.each(newsData.items, function (item) {
                    news.push({
                        id: item.id,
                        title: item.title,
                        href: item.alternate[0].href,
                        time: httpUtilsService.getDifference(currentDate, moment(item.published))
                    });
                });
                callback(null, {
                    unreadCount: unreadCountData.unreadcounts[0].count,
                    news: news
                });
            });
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