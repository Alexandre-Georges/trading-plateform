var https = require('https');

var newsService = {
    URL: 'cloud.feedly.com',
    BASE_PATH: '/v3',
    STREAM: 'user%2F7be76130-1791-4670-befa-9aabdc9a4837%2Fcategory%2Ffinance',
    NEWS_NUMBER: 20,
    getHeaders: function (token) {
        return {
            'Authorization': 'OAuth ' + token
        }
    },
    getNews: function (token, callback) {
        https.get(
            {
                hostname: newsService.URL,
                path: newsService.BASE_PATH + '/streams/' + newsService.STREAM + '/contents?unreadOnly=true&ranked=newest&count=' + newsService.NEWS_NUMBER,
                headers: newsService.getHeaders(token)
            }, (response) => {
            
                var allData = '';

                response.on('data', (data) => {
                    allData += data;
                });
                response.on('end', () => {
                    var responseData = JSON.parse(allData);
                    if (response.statusCode !== 200) {
                        callback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                        return;
                    }
                    callback(null, responseData);
                });

        }).on('error', (error) => {
            callback({ statusCode: 503, errorMessage: error });
        });
    },
    getUnreadCount: function (token, callback) {
        https.get(
            {
                hostname: newsService.URL,
                path: newsService.BASE_PATH + '/markers/counts?streamId=' + newsService.STREAM,
                headers: newsService.getHeaders(token)
            }, (response) => {
            
                var allData = '';

                response.on('data', (data) => {
                    allData += data;
                });
                response.on('end', () => {
                    var responseData = JSON.parse(allData);
                    if (response.statusCode !== 200) {
                        callback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                        return;
                    }
                    callback(null, responseData);
                });

        }).on('error', (error) => {
            callback({ statusCode: 503, errorMessage: error });
        });
    },
    readEntries: function (token, ids, callback) {
        var request = https.request(
            {
                method: 'POST',
                hostname: newsService.URL,
                path: newsService.BASE_PATH + '/markers',
                headers: newsService.getHeaders(token)
            }, (response) => {

                var allData = '';

                response.on('data', (data) => {
                    allData += data;
                });
                response.on('end', () => {
                    if (response.statusCode !== 200) {
                        var responseData = JSON.parse(allData);
                        callback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                        return;
                    }
                    callback(null);
                });

        }).on('error', (error) => {
            callback({ statusCode: 503, errorMessage: error });
        });
        request.write(JSON.stringify({
            entryIds: ids,
            action: 'markAsRead',
            type: 'entries'
        }));
        request.end();
    },
    unreadEntries: function (token, ids, callback) {
        var request = https.request(
            {
                method: 'POST',
                hostname: newsService.URL,
                path: newsService.BASE_PATH + '/markers',
                headers: newsService.getHeaders(token)
            }, (response) => {

                var allData = '';

                response.on('data', (data) => {
                    allData += data;
                });
                response.on('end', () => {
                    if (response.statusCode !== 200) {
                        var responseData = JSON.parse(allData);
                        callback({ statusCode: response.statusCode, errorMessage: responseData.errorMessage });
                        return;
                    }
                    callback(null);
                });

        }).on('error', (error) => {
            callback({ statusCode: 503, errorMessage: error });
        });
        request.write(JSON.stringify({
            entryIds: ids,
            action: 'keepUnread',
            type: 'entries'
        }));
        request.end();
    }
};
module.exports = newsService;