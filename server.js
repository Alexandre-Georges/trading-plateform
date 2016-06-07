const PORT = process.env.PORT || 8000;

var express = require('express');
var handlebars  = require('express-handlebars');
var url = require('url');

var newsService = require('./services/newsService.js');
var financeService = require('./services/financeService.js');
var httpUtilsService = require('./services/httpUtilsService.js');

var server = express();

server.engine('handlebars', handlebars());
server.set('view engine', 'handlebars');
server.use(express.static('public'));
server.use(express.static('node_modules/d3fc/dist'));
server.use(express.static('node_modules/moment'));

server.get('/', (request, response) => {
    response.render('trading');
});

server.get('/finance', (request, response) => {
    financeService.getData().then(data => {
        var dailyData = financeService.formatData(data);
        var weeklyData = financeService.toWeeklyData(dailyData);

        var dailyWithIndicators = financeService.addIndicators(dailyData);
        var weeklyWithIndicators = financeService.addIndicators(weeklyData);

        response.render('finance', {
            dailyDataString: JSON.stringify(dailyWithIndicators),
            weeklyDataString: JSON.stringify(weeklyWithIndicators)
        });
    }).catch(({ statusCode, errorMessage }) => {
        httpUtilsService.processError(response, statusCode, errorMessage);
    });
});

server.get('/news', (request, response) => {
    httpUtilsService.getNews(request.query.token).then(data => {
        response.render('news', { unreadCount: data.unreadCount, news: data.news });
    }).catch(({ statusCode, errorMessage }) => {
        httpUtilsService.processError(response, statusCode, errorMessage);
    });
});

server.delete('/news', (request, response) => {
    httpUtilsService.getData(request).then(data => {
        newsService.readEntries(request.query.token, data).then (() => {
            httpUtilsService.getNews(request.query.token).then(data => {
                response.render('news', { unreadCount: data.unreadCount, news: data.news, showUndoButton: true });
            }).catch(({ statusCode, errorMessage }) => {
                httpUtilsService.processError(response, statusCode, errorMessage);
            });
        }).catch(({ statusCode, errorMessage }) => {
            httpUtilsService.processError(response, statusCode, errorMessage);
        });
    }).catch(({ statusCode, errorMessage }) => {
        httpUtilsService.processError(response, statusCode, errorMessage);
    });
});

server.put('/news', (request, response) => {
    httpUtilsService.getData(request).then(data => {
        newsService.unreadEntries(request.query.token, data).then(() => {
            httpUtilsService.getNews(request.query.token).then(data => {
                response.render('news', { unreadCount: data.unreadCount, news: data.news });
            }).catch(({ statusCode, errorMessage }) => {
                httpUtilsService.processError(response, statusCode, errorMessage);
            });
        }).catch(({ statusCode, errorMessage }) => {
            httpUtilsService.processError(response, statusCode, errorMessage);
        });
    }).catch(({ statusCode, errorMessage }) => {
        httpUtilsService.processError(response, statusCode, errorMessage);
    });
});

server.listen(PORT, () => {
    console.log('Server up');
});