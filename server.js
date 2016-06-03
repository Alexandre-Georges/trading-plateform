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
    httpUtilsService.getNews(request.query.token).then(function (data) {
        response.render('news', { unreadCount: data.unreadCount, news: data.news });
    }).catch(function () {
        httpUtilsService.processError(response, error.statusCode, error.errorMessage);
    });
});

server.delete('/news', (request, response) => {
    httpUtilsService.getData(request).then(function (data) {
        newsService.readEntries(request.query.token, data).then (function () {
            httpUtilsService.getNews(request.query.token).then(function (data) {
                response.render('news', { unreadCount: data.unreadCount, news: data.news, showUndoButton: true });
            }, function (error) {
                httpUtilsService.processError(response, error.statusCode, error.errorMessage);
            });
        }, function (error) {
            httpUtilsService.processError(response, error.statusCode, error.errorMessage);
        });
    }.catch(function (error) {
        httpUtilsService.processError(response, error.statusCode, error.errorMessage);
    });
});

server.put('/news', (request, response) => {
    httpUtilsService.getData(request).then(function (data) {
        newsService.unreadEntries(request.query.token, data).then(function () {
            httpUtilsService.getNews(request.query.token).then(function (data) {
                response.render('news', { unreadCount: data.unreadCount, news: data.news });
            }, function (error) {
                httpUtilsService.processError(response, error.statusCode, error.errorMessage);
            });
        }, function (error) {
            httpUtilsService.processError(response, error.statusCode, error.errorMessage);
        });
    }.catch(function (error) {
        httpUtilsService.processError(response, error.statusCode, error.errorMessage);
    });
});

server.listen(PORT, function () {
    console.log('Server up');
});