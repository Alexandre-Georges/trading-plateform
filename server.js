const PORT = process.env.PORT || 8000;

var express = require('express');
var handlebars  = require('express-handlebars');
var url = require('url');

var newsService = require('./services/newsService.js');
var httpUtilsService = require('./services/httpUtilsService.js');

var server = express();

server.engine('handlebars', handlebars());
server.set('view engine', 'handlebars');
server.use(express.static('public'));

server.get('/', (request, response) => {
    response.render('trading');
});

server.get('/news', (request, response) => {
    httpUtilsService.getNews(request.query.token, function (error, result) {
        if (error) {
            httpUtilsService.processError(response, error.statusCode, error.errorMessage);
            return;
        }
        response.render('news', { unreadCount: result.unreadCount, news: result.news });
    });
});

server.delete('/news', (request, response) => {
    httpUtilsService.getData(request, function (data) {
        newsService.readEntries(request.query.token, data, function (error) {
            if (error) {
                httpUtilsService.processError(response, error.statusCode, error.errorMessage);
                return;
            }
            httpUtilsService.getNews(request.query.token, function (error, result) {
                if (error) {
                    httpUtilsService.processError(response, error.statusCode, error.errorMessage);
                    return;
                }
                response.render('news', { unreadCount: result.unreadCount, news: result.news, showUndoButton: true });
            });
        });
    });
});

server.put('/news', (request, response) => {
    httpUtilsService.getData(request, function (data) {

        newsService.unreadEntries(request.query.token, data, function (error) {
            if (error) {
                httpUtilsService.processError(response, error.statusCode, error.errorMessage);
                return;
            }
            httpUtilsService.getNews(request.query.token, function (error, result) {
                if (error) {
                    httpUtilsService.processError(response, error.statusCode, error.errorMessage);
                    return;
                }
                response.render('news', { unreadCount: result.unreadCount, news: result.news });
            });
        });
    });
});

server.listen(PORT, function () {
    console.log('Server up');
});